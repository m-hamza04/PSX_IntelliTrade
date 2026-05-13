const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');

// ================================
// CREATE PORTFOLIO
// POST /api/portfolio/create
// ================================
router.post('/create', async (req, res) => {
    // Frontend se user_id aur portfolio name aayega
    const { user_id, portfolio_name } = req.body;
    const normalizedPortfolioName = (portfolio_name || '').trim().replace(/\s+/g, ' ');
    
    let connection;
    try {
        connection = await getConnection();

        if (!normalizedPortfolioName) {
            return res.status(400).json({
                success: false,
                message: 'Portfolio name is required'
            });
        }

        const existingPortfolio = await connection.execute(
            `SELECT COUNT(*) AS portfolio_count
             FROM portfolios
             WHERE user_id = :user_id
             AND UPPER(TRIM(REGEXP_REPLACE(portfolio_name, '\\s+', ' '))) = UPPER(:portfolio_name)`,
            { user_id, portfolio_name: normalizedPortfolioName },
            { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
        );

        const portfolioCountRow = existingPortfolio.rows[0] || {};
        const portfolioCount = portfolioCountRow.PORTFOLIO_COUNT || portfolioCountRow.portfolio_count || 0;

        if (portfolioCount > 0) {
            return res.status(409).json({
                success: false,
                message: 'Portfolio name already exists for this user'
            });
        }
        
        await connection.execute(
            `INSERT INTO portfolios (user_id, portfolio_name)
             VALUES (:user_id, :portfolio_name)`,
            { user_id, portfolio_name: normalizedPortfolioName },
            { autoCommit: true }
        );
        
        res.json({ 
            success: true, 
            message: 'Portfolio created!' 
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
// GET USER PORTFOLIOS
// GET /api/portfolio/:user_id
// ================================
router.get('/:user_id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // User ke sare portfolios lao
        const result = await connection.execute(
            `SELECT portfolio_id, portfolio_name, 
                    created_at, total_invested
             FROM portfolios
             WHERE user_id = :user_id
             ORDER BY created_at DESC, portfolio_id DESC`,
            { user_id: req.params.user_id },
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
// GET PORTFOLIO HOLDINGS + P&L
// GET /api/portfolio/:portfolio_id/holdings
// ================================
router.get('/:portfolio_id/holdings', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // Portfolio analytics view se data lao
        // Yeh wahi view hai jo humne Oracle mein banaya tha!
        const result = await connection.execute(
            `SELECT symbol, company_name, quantity,
                    avg_buy_price, total_invested,
                    current_price, current_value,
                    profit_loss, pl_percentage
             FROM portfolio_analytics
             WHERE portfolio_id = :portfolio_id`,
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
// GET USER TRANSACTIONS
// GET /api/portfolio/:user_id/transactions
// ================================
router.get('/:user_id/transactions', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT t.transaction_id, c.symbol, c.company_name,
                    t.trans_type, t.quantity, t.price,
                    t.total_amount, t.trans_date
             FROM transactions t
             JOIN portfolios p ON t.portfolio_id = p.portfolio_id
             JOIN companies c ON t.company_id = c.company_id
             WHERE p.user_id = :user_id
             ORDER BY t.trans_date DESC`,
            { user_id: req.params.user_id },
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
// GET PORTFOLIO SUMMARY
// GET /api/portfolio/:portfolio_id/summary
// ================================
router.get('/:portfolio_id/summary', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT
                COUNT(*) AS total_stocks,
                NVL(SUM(current_value), 0) AS total_value,
                NVL(SUM(total_invested), 0) AS total_invested,
                NVL(SUM(profit_loss), 0) AS total_pl,
                ROUND(
                    CASE
                        WHEN NVL(SUM(total_invested), 0) = 0 THEN 0
                        ELSE (SUM(profit_loss) / SUM(total_invested)) * 100
                    END,
                    2
                ) AS total_pl_pct
             FROM portfolio_analytics
             WHERE portfolio_id = :portfolio_id`,
            { portfolio_id: req.params.portfolio_id },
            { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
        );

        res.json({
            success: true,
            data: result.rows[0] || {}
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
// GET PORTFOLIO RISK SCORE
// GET /api/portfolio/:portfolio_id/risk
// ================================
router.get('/:portfolio_id/risk', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT
                ROUND(AVG(sr.volatility), 2) AS avg_volatility,
                CASE
                    WHEN AVG(sr.volatility) > 15 THEN 'HIGH RISK'
                    WHEN AVG(sr.volatility) > 8 THEN 'MEDIUM RISK'
                    ELSE 'LOW RISK'
                END AS portfolio_risk
             FROM holdings h
             JOIN companies c ON h.company_id = c.company_id
             JOIN stock_risk sr ON c.symbol = sr.symbol
             WHERE h.portfolio_id = :portfolio_id
             AND h.quantity > 0`,
            { portfolio_id: req.params.portfolio_id },
            { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
        );

        const row = result.rows[0] || {};
        res.json({
            success: true,
            data: {
                AVG_VOLATILITY: row.AVG_VOLATILITY || 0,
                PORTFOLIO_RISK: row.PORTFOLIO_RISK || 'LOW RISK'
            }
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
// GET PORTFOLIO GROWTH (LAST 30 DAYS)
// GET /api/portfolio/:portfolio_id/growth
// ================================
router.get('/:portfolio_id/growth', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT sp.price_date,
                    SUM(h.quantity * sp.close_price) AS portfolio_value
             FROM holdings h
             JOIN stock_prices sp ON h.company_id = sp.company_id
             WHERE h.portfolio_id = :portfolio_id
             AND h.quantity > 0
             AND sp.price_date >= SYSDATE - 30
             GROUP BY sp.price_date
             ORDER BY sp.price_date ASC`,
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
// BUY STOCK
// POST /api/portfolio/buy
// ================================
router.post('/buy', async (req, res) => {
    const { portfolio_id, company_id, quantity, price } = req.body;
    const numericQuantity = Number(quantity);
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Price cannot be zero'
        });
    }

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Quantity cannot be zero'
        });
    }
    
    let connection;
    try {
        connection = await getConnection();
        
        // Transaction insert karo
        // Trigger automatically holdings update karega!
        await connection.execute(
            `INSERT INTO transactions 
             (portfolio_id, company_id, trans_type, quantity, price, total_amount)
             VALUES (:portfolio_id, :company_id, 'BUY', :quantity, :price, :total)`,
            { 
                portfolio_id, 
                company_id, 
                quantity: numericQuantity,
                price: numericPrice,
                total: numericQuantity * numericPrice
            },
            { autoCommit: true }
        );
        
        res.json({ 
            success: true, 
            message: `Bought ${quantity} shares successfully!` 
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
// SELL STOCK
// POST /api/portfolio/sell
// ================================
router.post('/sell', async (req, res) => {
    const { portfolio_id, company_id, quantity, price } = req.body;
    const numericQuantity = Number(quantity);
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Price cannot be zero'
        });
    }

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Quantity cannot be zero'
        });
    }
    
    let connection;
    try {
        connection = await getConnection();

        const holdingsResult = await connection.execute(
            `SELECT quantity
             FROM holdings
             WHERE portfolio_id = :portfolio_id
             AND company_id = :company_id`,
            {
                portfolio_id,
                company_id
            },
            { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
        );

        if (!holdingsResult.rows || holdingsResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'You dont own this stock'
            });
        }

        const availableQuantity = Number(holdingsResult.rows[0].QUANTITY || 0);
        if (availableQuantity < numericQuantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient shares. You only have ${availableQuantity} shares`
            });
        }
        
        await connection.execute(
            `INSERT INTO transactions 
             (portfolio_id, company_id, trans_type, quantity, price, total_amount)
             VALUES (:portfolio_id, :company_id, 'SELL', :quantity, :price, :total)`,
            { 
                portfolio_id, 
                company_id, 
                quantity: numericQuantity,
                price: numericPrice,
                total: numericQuantity * numericPrice
            },
            { autoCommit: false }
        );

        await connection.execute(
            `DELETE FROM holdings
             WHERE portfolio_id = :pid
             AND company_id = :cid
             AND quantity <= 0`,
            {
                pid: portfolio_id,
                cid: company_id
            },
            { autoCommit: false }
        );

        await connection.commit();
        
        res.json({ 
            success: true, 
            message: `Sold ${quantity} shares successfully!` 
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                // Ignore rollback errors, original error will be returned.
            }
        }
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;