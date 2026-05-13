const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');

// ================================
// REGISTER — Naya user banao
// POST /api/auth/register
// ================================
router.post('/register', async (req, res) => {
    // Frontend se yeh data aayega
    const { username, email, password, role } = req.body;
    
    let connection;
    try {
        // Oracle se connect karo
        connection = await getConnection();
        
        // Register procedure call karo
        // Jo humne Oracle mein banaya tha!
        await connection.execute(
            `BEGIN register_user(:username, :email, :password, :role); END;`,
            { 
                username: username, 
                email: email, 
                password: password,
                role: role || 'INVESTOR'
            }
        );
        
        res.json({ 
            success: true, 
            message: 'User registered successfully!' 
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    } finally {
        // Connection hamesha close karo
        if (connection) await connection.close();
    }
});

// ================================
// LOGIN — User login karo
// POST /api/auth/login
// ================================
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const normalizedUsername = (username || '').trim();
    const normalizedPassword = (password || '').trim();
    
    let connection;
    try {
        connection = await getConnection();
        
        // PSX_LOGIN function call karo
        // Jo humne Oracle mein banaya tha!
        const result = await connection.execute(
            `SELECT psx_login(:username, :password) AS result FROM DUAL`,
            { username: normalizedUsername, password: normalizedPassword }
        );
        
        const loginResult = result.rows[0][0];
        
        // Result check karo
        if (loginResult.startsWith('SUCCESS')) {
            const role = loginResult.split(':')[1];

            const userResult = await connection.execute(
                `SELECT user_id
                 FROM users
                 WHERE LOWER(username) = LOWER(:username)
                 AND is_active = 1`,
                { username: normalizedUsername },
                { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Authenticated user not found'
                });
            }

            const userRow = userResult.rows[0];
            const userId = userRow.USER_ID;

            res.json({ 
                success: true, 
                role: role,
                username: normalizedUsername,
                user_id: userId,
                message: 'Login successful!' 
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    } finally {
        if (connection) await connection.close();
    }
});

// ================================
// GET USER DETAILS BY USERNAME
// GET /api/auth/user/:username
// ================================
router.get('/user/:username', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT user_id, username, role
             FROM users
             WHERE LOWER(username) = LOWER(:username) AND is_active = 1`,
            { username: req.params.username.trim() },
            { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;