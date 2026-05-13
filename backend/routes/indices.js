const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');
const oracledb = require('oracledb');

// ================================
// GET ALL MARKET INDICES
// GET /api/indices
// ================================
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT index_id, index_name, description, base_value, launch_date
             FROM market_indices
             ORDER BY index_name`,
            [],
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
// GET INDEX STOCKS
// GET /api/indices/:index_id/stocks
// ================================
router.get('/:index_id/stocks', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT c.symbol,
                    c.company_name,
                    c.sector,
                    ic.weightage,
                    sp.close_price AS current_price,
                    tgl.pct_change
             FROM index_components ic
             JOIN companies c ON ic.company_id = c.company_id
             JOIN (
                SELECT company_id, close_price,
                       RANK() OVER (PARTITION BY company_id ORDER BY price_date DESC) AS rn
                FROM stock_prices
             ) sp ON c.company_id = sp.company_id AND sp.rn = 1
             LEFT JOIN top_gainers_losers tgl ON c.company_id = tgl.company_id
             WHERE ic.index_id = :index_id
             ORDER BY ic.weightage DESC`,
            { index_id: req.params.index_id },
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

module.exports = router;
