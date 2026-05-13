-- =============================================
-- PSX IntelliTrade AI
-- 08_watchlist.sql
-- =============================================

CREATE TABLE watchlist (
    watchlist_id  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       NUMBER NOT NULL,
    company_id    NUMBER NOT NULL,
    added_date    DATE DEFAULT SYSDATE,
    notes         VARCHAR2(200),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id),
    CONSTRAINT uq_watchlist UNIQUE (user_id, company_id)
);

CREATE SEQUENCE seq_watchlist_id 
START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;