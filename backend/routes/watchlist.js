const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');
const oracledb = require('oracledb');

// ================================
// GET USER WATCHLIST
// GET /api/watchlist/:user_id
// ================================
router.get('/:user_id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT w.watchlist_id,
                    c.company_id,
                    c.symbol,
                    c.company_name,
                    c.sector,
                    sp.close_price AS current_price,
                    tgl.pct_change,
                    w.added_date,
                    w.notes
             FROM watchlist w
             JOIN companies c ON w.company_id = c.company_id
             JOIN (
                SELECT company_id, close_price,
                       RANK() OVER (PARTITION BY company_id ORDER BY price_date DESC) AS rn
                FROM stock_prices
             ) sp ON c.company_id = sp.company_id AND sp.rn = 1
             LEFT JOIN top_gainers_losers tgl ON c.company_id = tgl.company_id
             WHERE w.user_id = :user_id
             ORDER BY w.added_date DESC`,
            { user_id: req.params.user_id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json({
            success: true,
            data: result.rows
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

// ================================
// ADD TO WATCHLIST
// POST /api/watchlist/add
// ================================
router.post('/add', async (req, res) => {
    const { user_id, company_id, notes } = req.body;

    let connection;
    try {
        connection = await getConnection();

        const check = await connection.execute(
            `SELECT watchlist_id
             FROM watchlist
             WHERE user_id = :user_id
             AND company_id = :company_id`,
            {
                user_id: Number(user_id),
                company_id: Number(company_id)
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (check.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Already in watchlist!'
            });
        }

        await connection.execute(
            `INSERT INTO watchlist
             (user_id, company_id, notes)
             VALUES (:user_id, :company_id, :notes)`,
            {
                user_id: Number(user_id),
                company_id: Number(company_id),
                notes: notes || ''
            },
            { autoCommit: true }
        );

        res.json({
            success: true,
            message: 'Added to watchlist!'
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

// ================================
// REMOVE FROM WATCHLIST
// DELETE /api/watchlist/remove
// ================================
router.delete('/remove', async (req, res) => {
    const { user_id, company_id } = req.body;

    let connection;
    try {
        connection = await getConnection();

        const check = await connection.execute(
            `SELECT watchlist_id
             FROM watchlist
             WHERE user_id = :user_id
             AND company_id = :company_id`,
            {
                user_id: Number(user_id),
                company_id: Number(company_id)
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (check.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Stock not found in watchlist'
            });
        }

        await connection.execute(
            `DELETE FROM watchlist
             WHERE user_id = :user_id
             AND company_id = :company_id`,
            {
                user_id: Number(user_id),
                company_id: Number(company_id)
            },
            { autoCommit: true }
        );

        res.json({
            success: true,
            message: 'Removed from watchlist!'
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
