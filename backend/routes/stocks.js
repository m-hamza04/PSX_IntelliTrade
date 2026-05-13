const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');

// ================================
// GET ALL STOCKS
// GET /api/stocks
// ================================
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // Saari companies lao latest price ke saath
        const result = await connection.execute(
            `SELECT 
                c.company_id,
                c.symbol,
                c.company_name,
                c.sector,
                sp.close_price AS current_price,
                sp.open_price,
                sp.high_price,
                sp.low_price,
                sp.volume
            FROM companies c
            JOIN (
                SELECT company_id, close_price, open_price, 
                       high_price, low_price, volume,
                       RANK() OVER (PARTITION BY company_id 
                       ORDER BY price_date DESC) AS rn
                FROM stock_prices
            ) sp ON c.company_id = sp.company_id AND sp.rn = 1
            ORDER BY c.symbol`,
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
// GET STOCK HISTORY
// GET /api/stocks/:symbol/history
// ================================
router.get('/:symbol/history', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const parsedDays = Number.parseInt(req.query.days, 10);
        const days = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 30;
        
        // Ek stock ki 30 din ki history
        const result = await connection.execute(
            `SELECT 
                sp.price_date,
                sp.open_price,
                sp.high_price,
                sp.low_price,
                sp.close_price,
                sp.volume
            FROM stock_prices sp
            JOIN companies c ON sp.company_id = c.company_id
            WHERE c.symbol = :symbol
            AND sp.price_date >= SYSDATE - :days
            ORDER BY sp.price_date ASC`,
            {
                symbol: req.params.symbol.toUpperCase(),
                days
            },
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
// GET STOCK DETAIL
// GET /api/stocks/:symbol/detail
// ================================
router.get('/:symbol/detail', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT c.symbol, c.company_name, c.sector,
                    sp.close_price, sp.open_price,
                    sp.high_price, sp.low_price, sp.volume,
                    sr.volatility, sr.risk_level, sr.avg_price,
                    tgl.pct_change, tgl.price_change
             FROM companies c
             JOIN (
                 SELECT company_id, close_price, open_price,
                        high_price, low_price, volume
                 FROM stock_prices
                 WHERE price_date = (SELECT MAX(price_date) FROM stock_prices)
             ) sp ON c.company_id = sp.company_id
             JOIN stock_risk sr ON c.symbol = sr.symbol
             JOIN top_gainers_losers tgl ON c.company_id = tgl.company_id
             WHERE c.symbol = :symbol`,
            { symbol: req.params.symbol.toUpperCase() },
            { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
        );

        res.json({
            success: true,
            data: result.rows[0] || null
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
// GET TOP GAINERS
// GET /api/stocks/gainers
// ================================
router.get('/gainers', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        const result = await connection.execute(
            `SELECT symbol, company_name, sector,
                    today_price, yesterday_price,
                    price_change, pct_change
             FROM top_gainers_losers
             WHERE gainer_rank <= 5
             ORDER BY gainer_rank`,
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
// GET TOP LOSERS
// GET /api/stocks/losers
// ================================
router.get('/losers', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        const result = await connection.execute(
            `SELECT symbol, company_name, sector,
                    today_price, yesterday_price,
                    price_change, pct_change
             FROM top_gainers_losers
             WHERE loser_rank <= 5
             ORDER BY loser_rank`,
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
// GET RISK SCORES
// GET /api/stocks/risk
// ================================
router.get('/risk', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        const result = await connection.execute(
            `SELECT symbol, company_name, sector,
                    volatility, avg_price, risk_level
             FROM stock_risk
             ORDER BY volatility DESC`,
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

module.exports = router;