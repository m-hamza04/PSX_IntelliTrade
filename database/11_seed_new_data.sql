-- =============================================
-- PSX IntelliTrade AI
-- 11_seed_new_data.sql
-- =============================================

SET DEFINE OFF

-- MARKET INDICES
INSERT INTO market_indices (index_name, description, base_value, launch_date)
VALUES ('KSE-5', 'Top 5 companies by market cap', 1000, TO_DATE('1991-11-01', 'YYYY-MM-DD'));

INSERT INTO market_indices (index_name, description, base_value, launch_date)
VALUES ('KSE-10', 'Top 10 companies by free float', 1000, TO_DATE('2006-09-01', 'YYYY-MM-DD'));

INSERT INTO market_indices (index_name, description, base_value, launch_date)
VALUES ('KSE All Share', 'All listed companies', 1000, TO_DATE('2006-09-01', 'YYYY-MM-DD'));
COMMIT;

-- KSE-5 Components
INSERT INTO index_components (index_id, company_id, weightage) VALUES (1, 4, 6.30);  -- HBL
INSERT INTO index_components (index_id, company_id, weightage) VALUES (1, 5, 5.80);  -- UBL
INSERT INTO index_components (index_id, company_id, weightage) VALUES (1, 1, 5.20);  -- OGDC
INSERT INTO index_components (index_id, company_id, weightage) VALUES (1, 6, 4.90);  -- MCB
INSERT INTO index_components (index_id, company_id, weightage) VALUES (1, 9, 4.50);  -- ENGRO
COMMIT;

-- KSE-10 Components
INSERT INTO index_components (index_id, company_id, weightage) VALUES (2, 4, 9.20);  -- HBL
INSERT INTO index_components (index_id, company_id, weightage) VALUES (2, 5, 8.80);  -- UBL
INSERT INTO index_components (index_id, company_id, weightage) VALUES (2, 1, 8.50);  -- OGDC
INSERT INTO index_components (index_id, company_id, weightage) VALUES (2, 6, 7.60);  -- MCB
INSERT INTO index_components (index_id, company_id, weightage) VALUES (2, 9, 6.40);  -- ENGRO
INSERT INTO index_components (index_id, company_id, weightage) VALUES (2, 3, 6.10);  -- PSO
INSERT INTO index_components (index_id, company_id, weightage) VALUES (2, 2, 5.80);  -- PPL
INSERT INTO index_components (index_id, company_id, weightage) VALUES (2, 7, 5.20);  -- ABL
INSERT INTO index_components (index_id, company_id, weightage) VALUES (2, 8, 4.80);  -- BAFL
INSERT INTO index_components (index_id, company_id, weightage) VALUES (2, 11, 4.30); -- FFC
COMMIT;

-- KSE All Share (all 20 companies)
INSERT INTO index_components (index_id, company_id, weightage)
SELECT 3, company_id, ROUND(DBMS_RANDOM.VALUE(0.5, 3.0), 2)
FROM companies;
COMMIT;

-- WATCHLIST Sample Data
INSERT INTO watchlist (user_id, company_id, notes) VALUES (8, 1, 'Energy sector pick');
INSERT INTO watchlist (user_id, company_id, notes) VALUES (8, 4, 'Banking dividend stock');
INSERT INTO watchlist (user_id, company_id, notes) VALUES (8, 9, 'Long term hold');
INSERT INTO watchlist (user_id, company_id, notes) VALUES (9, 2, 'Oil play');
INSERT INTO watchlist (user_id, company_id, notes) VALUES (9, 6, 'Banking sector');
INSERT INTO watchlist (user_id, company_id, notes) VALUES (10, 18, 'Tech growth stock');
INSERT INTO watchlist (user_id, company_id, notes) VALUES (10, 15, 'Power sector');
COMMIT;

-- NEWS
INSERT INTO news (title, content, source, category, published_date)
VALUES ('PSX market shows positive momentum', 'Pakistan Stock Exchange closed higher driven by banking and energy sectors', 'Dawn News', 'Market', TO_DATE('2026-04-16', 'YYYY-MM-DD'));

INSERT INTO news (title, content, source, category, published_date)
VALUES ('Banking sector leads market rally', 'Major banking stocks including HBL UBL and MCB posted gains today', 'ARY News', 'Sector', TO_DATE('2026-04-16', 'YYYY-MM-DD'));

INSERT INTO news (title, content, source, category, published_date)
VALUES ('Energy stocks gain on oil price recovery', 'OGDC PPL and PSO shares rose as global oil prices strengthened', 'Geo News', 'Sector', TO_DATE('2026-04-15', 'YYYY-MM-DD'));

INSERT INTO news (title, content, source, category, published_date)
VALUES ('SBP monetary policy supports equity market', 'State Bank of Pakistan policy decision boosts investor confidence', 'Dawn News', 'Economy', TO_DATE('2026-04-15', 'YYYY-MM-DD'));

INSERT INTO news (title, content, source, category, published_date)
VALUES ('Cement sector outlook remains strong', 'Lucky Cement DG Khan and Maple Leaf report healthy demand forecasts', 'Business Recorder', 'Sector', TO_DATE('2026-04-14', 'YYYY-MM-DD'));

INSERT INTO news (title, content, source, category, published_date)
VALUES ('Technology stocks attract foreign investment', 'Systems Limited and TRG Pakistan see increased institutional buying', 'The News', 'Sector', TO_DATE('2026-04-14', 'YYYY-MM-DD'));

INSERT INTO news (title, content, source, category, published_date)
VALUES ('Fertilizer companies benefit from lower input costs', 'Engro FFC and EFERT margins improve on declining gas prices', 'Dawn News', 'Sector', TO_DATE('2026-04-13', 'YYYY-MM-DD'));

INSERT INTO news (title, content, source, category, published_date)
VALUES ('Power sector stocks show resilience', 'HUBC and KAPCO maintain steady performance amid energy reforms', 'ARY News', 'Sector', TO_DATE('2026-04-13', 'YYYY-MM-DD'));

INSERT INTO news (title, content, source, category, published_date)
VALUES ('FMCG stocks outperform market expectations', 'Nestle Pakistan and Unilever report strong consumer demand', 'Geo News', 'Sector', TO_DATE('2026-04-12', 'YYYY-MM-DD'));

INSERT INTO news (title, content, source, category, published_date)
VALUES ('PSX introduces new trading regulations', 'Pakistan Stock Exchange announces updated compliance framework', 'Business Recorder', 'Regulatory', TO_DATE('2026-04-12', 'YYYY-MM-DD'));
COMMIT;

-- COMPANY NEWS
INSERT INTO company_news (news_id, company_id, impact) VALUES (5, 4, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (5, 5, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (5, 1, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (6, 4, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (6, 5, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (6, 6, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (7, 1, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (7, 2, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (7, 3, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (8, 4, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (8, 5, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (8, 6, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (8, 7, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (9, 12, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (9, 13, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (9, 14, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (10, 18, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (10, 17, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (11, 9,  'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (11, 11, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (11, 10, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (12, 15, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (12, 16, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (13, 19, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (13, 20, 'POSITIVE');
INSERT INTO company_news (news_id, company_id, impact) VALUES (14, 1,  'NEUTRAL');
INSERT INTO company_news (news_id, company_id, impact) VALUES (14, 4,  'NEUTRAL');
INSERT INTO company_news (news_id, company_id, impact) VALUES (14, 9,  'NEUTRAL');
INSERT INTO company_news (news_id, company_id, impact) VALUES (14, 12, 'NEUTRAL');
COMMIT;