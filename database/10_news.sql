-- =============================================
-- PSX IntelliTrade AI
-- 10_news.sql
-- =============================================

CREATE TABLE news (
    news_id        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title          VARCHAR2(200) NOT NULL,
    content        VARCHAR2(1000),
    source         VARCHAR2(100),
    category       VARCHAR2(50),
    published_date DATE DEFAULT SYSDATE
);

CREATE TABLE company_news (
    cn_id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    news_id        NUMBER NOT NULL,
    company_id     NUMBER NOT NULL,
    impact         VARCHAR2(10),
    added_date     DATE DEFAULT SYSDATE,
    FOREIGN KEY (news_id) REFERENCES news(news_id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id),
    CONSTRAINT uq_company_news UNIQUE (news_id, company_id)
);

CREATE SEQUENCE seq_news_id 
START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE seq_company_news_id 
START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;