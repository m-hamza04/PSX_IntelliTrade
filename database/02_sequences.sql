-- =============================================
-- PSX IntelliTrade AI
-- 02_sequences.sql
-- =============================================

CREATE SEQUENCE seq_company_id START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_price_id START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_user_id START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_portfolio_id START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_holding_id START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_transaction_id START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_alert_id START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- -- New Sequences for Phase 2 Tables
-- CREATE SEQUENCE seq_watchlist_id
--     START WITH 1
--     INCREMENT BY 1
--     NOCACHE
--     NOCYCLE;

-- CREATE SEQUENCE seq_market_index_id
--     START WITH 1
--     INCREMENT BY 1
--     NOCACHE
--     NOCYCLE;

-- CREATE SEQUENCE seq_component_id
--     START WITH 1
--     INCREMENT BY 1
--     NOCACHE
--     NOCYCLE;

-- CREATE SEQUENCE seq_news_id
--     START WITH 1
--     INCREMENT BY 1
--     NOCACHE
--     NOCYCLE;

-- CREATE SEQUENCE seq_company_news_id
--     START WITH 1
--     INCREMENT BY 1
--     NOCACHE
--     NOCYCLE;