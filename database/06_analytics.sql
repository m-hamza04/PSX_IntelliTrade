-- =============================================
-- PSX IntelliTrade AI
-- 06_analytics.sql
-- =============================================

-- 1. PORTFOLIO VALUE & PROFIT/LOSS
CREATE OR REPLACE VIEW portfolio_analytics AS
SELECT
    p.portfolio_id,
    p.portfolio_name,
    u.username,
    c.symbol,
    c.company_name,
    h.quantity,
    h.avg_buy_price,
    h.total_invested,
    sp.close_price AS current_price,
    ROUND(h.quantity * sp.close_price, 2) AS current_value,
    ROUND((h.quantity * sp.close_price) - h.total_invested, 2) AS profit_loss,
    CASE
        WHEN h.total_invested = 0 THEN 0
        ELSE ROUND(((h.quantity * sp.close_price) - h.total_invested) / h.total_invested * 100, 2)
    END AS pl_percentage
FROM holdings h
JOIN portfolios p ON h.portfolio_id = p.portfolio_id
JOIN users u ON p.user_id = u.user_id
JOIN companies c ON h.company_id = c.company_id
JOIN (
    SELECT company_id, close_price,
           RANK() OVER (PARTITION BY company_id ORDER BY price_date DESC) AS rn
    FROM stock_prices
) sp ON h.company_id = sp.company_id AND sp.rn = 1;

-- 2. RISK SCORE
CREATE OR REPLACE VIEW stock_risk AS
SELECT
    c.symbol,
    c.company_name,
    c.sector,
    ROUND(STDDEV(sp.close_price), 2) AS volatility,
    ROUND(AVG(sp.close_price), 2) AS avg_price,
    ROUND(MAX(sp.close_price), 2) AS max_price,
    ROUND(MIN(sp.close_price), 2) AS min_price,
    CASE
        WHEN STDDEV(sp.close_price) > 15 THEN 'HIGH RISK'
        WHEN STDDEV(sp.close_price) > 8  THEN 'MEDIUM RISK'
        ELSE 'LOW RISK'
    END AS risk_level
FROM stock_prices sp
JOIN companies c ON sp.company_id = c.company_id
GROUP BY c.symbol, c.company_name, c.sector;

-- 3. TOP GAINERS & LOSERS
CREATE OR REPLACE VIEW top_gainers_losers AS
SELECT
    c.company_id,
    c.symbol,
    c.company_name,
    c.sector,
    sp_today.close_price AS today_price,
    sp_yesterday.close_price AS yesterday_price,
    ROUND(sp_today.close_price - sp_yesterday.close_price, 2) AS price_change,
    ROUND(((sp_today.close_price - sp_yesterday.close_price) / sp_yesterday.close_price) * 100, 2) AS pct_change,
    RANK() OVER (ORDER BY ((sp_today.close_price - sp_yesterday.close_price) / sp_yesterday.close_price) DESC) AS gainer_rank,
    RANK() OVER (ORDER BY ((sp_today.close_price - sp_yesterday.close_price) / sp_yesterday.close_price) ASC) AS loser_rank
FROM companies c
JOIN (
    SELECT company_id, close_price
    FROM stock_prices
    WHERE price_date = (SELECT MAX(price_date) FROM stock_prices)
) sp_today ON c.company_id = sp_today.company_id
JOIN (
    SELECT company_id, close_price
    FROM stock_prices
    WHERE price_date = (SELECT MAX(price_date) - 1 FROM stock_prices)
) sp_yesterday ON c.company_id = sp_yesterday.company_id;