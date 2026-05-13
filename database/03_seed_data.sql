-- =============================================
-- PSX IntelliTrade AI
-- 03_seed_data.sql - PSX Companies + Users + Stock Prices
-- =============================================

SET DEFINE OFF

-- PSX COMPANIES
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('OGDC', 'Oil and Gas Development Company', 'Energy', TO_DATE('2000-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('PPL', 'Pakistan Petroleum Limited', 'Energy', TO_DATE('1995-06-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('PSO', 'Pakistan State Oil', 'Energy', TO_DATE('1978-03-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('HBL', 'Habib Bank Limited', 'Banking', TO_DATE('2006-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('UBL', 'United Bank Limited', 'Banking', TO_DATE('2002-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('MCB', 'MCB Bank Limited', 'Banking', TO_DATE('1991-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('ABL', 'Allied Bank Limited', 'Banking', TO_DATE('2004-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('BAFL', 'Bank Alfalah Limited', 'Banking', TO_DATE('1997-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('ENGRO', 'Engro Corporation', 'Fertilizer', TO_DATE('1991-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('EFERT', 'Engro Fertilizers', 'Fertilizer', TO_DATE('2010-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('FFC', 'Fauji Fertilizer Company', 'Fertilizer', TO_DATE('1985-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('LUCK', 'Lucky Cement', 'Cement', TO_DATE('1996-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('DGKC', 'DG Khan Cement', 'Cement', TO_DATE('1986-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('MLCF', 'Maple Leaf Cement', 'Cement', TO_DATE('1994-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('HUBC', 'Hub Power Company', 'Power', TO_DATE('1997-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('KAPCO', 'Kot Addu Power Company', 'Power', TO_DATE('1996-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('TRG', 'TRG Pakistan', 'Technology', TO_DATE('2003-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('SYS', 'Systems Limited', 'Technology', TO_DATE('2003-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('NESTLE', 'Nestle Pakistan', 'FMCG', TO_DATE('1988-01-01', 'YYYY-MM-DD'));
INSERT INTO companies (symbol, company_name, sector, listed_date) VALUES ('UNILEVER', 'Unilever Pakistan', 'FMCG', TO_DATE('1988-01-01', 'YYYY-MM-DD'));
COMMIT;

-- USERS
INSERT INTO users (username, email, password_hash, role) VALUES ('admin', 'admin@psx.com', RAWTOHEX(UTL_RAW.CAST_TO_RAW('admin123')), 'ADMIN');
INSERT INTO users (username, email, password_hash, role) VALUES ('ali_investor', 'ali@gmail.com', RAWTOHEX(UTL_RAW.CAST_TO_RAW('ali123')), 'INVESTOR');
INSERT INTO users (username, email, password_hash, role) VALUES ('sara_investor', 'sara@gmail.com', RAWTOHEX(UTL_RAW.CAST_TO_RAW('sara123')), 'INVESTOR');
COMMIT;

-- SIMULATE STOCK PRICES (365 days)
BEGIN
    FOR comp IN (SELECT company_id, symbol FROM companies) LOOP
        FOR i IN 1..365 LOOP
            INSERT INTO stock_prices (company_id, price_date, open_price, high_price, low_price, close_price, volume)
            VALUES (
                comp.company_id,
                SYSDATE - (365 - i),
                ROUND(100 + DBMS_RANDOM.VALUE(-20, 20), 2),
                ROUND(100 + DBMS_RANDOM.VALUE(0, 25), 2),
                ROUND(100 + DBMS_RANDOM.VALUE(-25, 0), 2),
                ROUND(100 + DBMS_RANDOM.VALUE(-20, 20), 2),
                ROUND(DBMS_RANDOM.VALUE(100000, 9999999))
            );
        END LOOP;
    END LOOP;
    COMMIT;
END;
/