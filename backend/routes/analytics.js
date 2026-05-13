const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');

// ================================
// GET PORTFOLIO RISK SCORE
// GET /api/analytics/risk/:portfolio_id
// ================================
router.get('/risk/:portfolio_id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // Stock risk view se data lao
        // Sirf us portfolio ki holdings ka risk
        const result = await connection.execute(
            `SELECT sr.symbol, sr.company_name,
                    sr.volatility, sr.risk_level,
                    sr.avg_price, sr.max_price, sr.min_price
             FROM stock_risk sr
             JOIN holdings h ON sr.symbol = (
                SELECT symbol FROM companies 
                WHERE company_id = h.company_id
             )
             WHERE h.portfolio_id = :portfolio_id`,
            { portfolio_id: req.params.portfolio_id },
            { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
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
// GET MARKET SUMMARY
// GET /api/analytics/market
// ================================
router.get('/market', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // Market overview
        const result = await connection.execute(
            `SELECT 
                COUNT(*) AS total_stocks,
                SUM(CASE WHEN pct_change > 0 THEN 1 ELSE 0 END) AS gainers,
                SUM(CASE WHEN pct_change < 0 THEN 1 ELSE 0 END) AS losers,
                ROUND(AVG(pct_change), 2) AS avg_change,
                ROUND(MAX(pct_change), 2) AS max_gain,
                ROUND(MIN(pct_change), 2) AS max_loss
             FROM top_gainers_losers`,
            [],
            { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
        );
        
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

// ================================
// GET SECTOR PERFORMANCE
// GET /api/analytics/sectors
// ================================
router.get('/sectors', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // Sector wise performance
        const result = await connection.execute(
            `SELECT 
                c.sector,
                COUNT(*) AS total_stocks,
                ROUND(AVG(tgl.pct_change), 2) AS avg_change,
                ROUND(AVG(sr.volatility), 2) AS avg_volatility
             FROM companies c
             JOIN top_gainers_losers tgl ON c.company_id = tgl.company_id
             JOIN stock_risk sr ON c.symbol = sr.symbol
             GROUP BY c.sector
             ORDER BY avg_change DESC`,
            [],
            { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
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
// GET ALERTS
// GET /api/analytics/alerts
// ================================
router.get('/alerts', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        const result = await connection.execute(
            `SELECT a.alert_id, c.symbol, c.company_name,
                    a.alert_type, a.message, a.is_read, a.created_at
             FROM alerts a
             JOIN companies c ON a.company_id = c.company_id
             ORDER BY a.created_at DESC`,
            [],
            { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
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
// MARK ALERT AS READ
// PUT /api/analytics/alerts/:alert_id/read
// ================================
router.put('/alerts/:alert_id/read', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        await connection.execute(
            `UPDATE alerts
             SET is_read = 1
             WHERE alert_id = :alert_id`,
            { alert_id: req.params.alert_id },
            { autoCommit: true }
        );

        res.json({
            success: true,
            message: 'Alert marked as read'
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