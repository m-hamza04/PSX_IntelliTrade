const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const { getConnection } = require('../db');

// ================================
// GET ADMIN STATS
// GET /api/admin/stats
// ================================
router.get('/stats', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const [users, portfolios, transactions, alerts] = await Promise.all([
            connection.execute(`SELECT COUNT(*) AS total_users FROM users`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(`SELECT COUNT(*) AS total_portfolios FROM portfolios`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(`SELECT COUNT(*) AS total_transactions FROM transactions`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(`SELECT COUNT(*) AS total_alerts FROM alerts`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })
        ]);

        res.json({
            success: true,
            data: {
                total_users: users.rows[0].TOTAL_USERS,
                total_portfolios: portfolios.rows[0].TOTAL_PORTFOLIOS,
                total_transactions: transactions.rows[0].TOTAL_TRANSACTIONS,
                total_alerts: alerts.rows[0].TOTAL_ALERTS
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ================================
// GET ALL USERS
// GET /api/admin/users
// ================================
router.get('/users', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT user_id, username, email, role, created_at, is_active
             FROM users
             ORDER BY created_at DESC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ================================
// UPDATE USER ROLE TO ADMIN
// PUT /api/admin/users/:user_id/role
// ================================
router.put('/users/:user_id/role', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        await connection.execute(
            `UPDATE users SET role = 'ADMIN' WHERE user_id = :id`,
            { id: req.params.user_id },
            { autoCommit: true }
        );

        res.json({ success: true, message: 'User promoted to ADMIN' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ================================
// DEACTIVATE USER
// PUT /api/admin/users/:user_id/deactivate
// ================================
router.put('/users/:user_id/deactivate', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        await connection.execute(
            `UPDATE users SET is_active = 0 WHERE user_id = :id`,
            { id: req.params.user_id },
            { autoCommit: true }
        );

        res.json({ success: true, message: 'User deactivated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ================================
// ACTIVATE USER
// PUT /api/admin/users/:user_id/activate
// ================================
router.put('/users/:user_id/activate', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        await connection.execute(
            `UPDATE users SET is_active = 1 WHERE user_id = :id`,
            { id: req.params.user_id },
            { autoCommit: true }
        );

        res.json({ success: true, message: 'User activated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ================================
// GENERATE ALERTS
// POST /api/admin/generate-alerts
// ================================
router.post('/generate-alerts', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        await connection.execute(`BEGIN generate_alerts; END;`, [], { autoCommit: true });

        res.json({ success: true, message: 'Market alerts generated successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ================================
// GET ALL TRANSACTIONS
// GET /api/admin/transactions
// ================================
router.get('/transactions', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT u.username, c.symbol, t.trans_type,
                    t.quantity, t.price, t.trans_date
             FROM transactions t
             JOIN portfolios p ON t.portfolio_id = p.portfolio_id
             JOIN users u ON p.user_id = u.user_id
             JOIN companies c ON t.company_id = c.company_id
             ORDER BY t.trans_date DESC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;