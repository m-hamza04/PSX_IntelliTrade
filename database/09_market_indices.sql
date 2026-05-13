-- =============================================
-- PSX IntelliTrade AI
-- 09_market_indices.sql
-- =============================================

CREATE TABLE market_indices (
    index_id      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    index_name    VARCHAR2(50) NOT NULL UNIQUE,
    description   VARCHAR2(200),
    base_value    NUMBER(10,2),
    launch_date   DATE
);

CREATE TABLE index_components (
    component_id  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    index_id      NUMBER NOT NULL,
    company_id    NUMBER NOT NULL,
    weightage     NUMBER(5,2),
    added_date    DATE DEFAULT SYSDATE,
    FOREIGN KEY (index_id) REFERENCES market_indices(index_id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id),
    CONSTRAINT uq_index_comp UNIQUE (index_id, company_id)
);

CREATE SEQUENCE seq_market_index_id 
START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE seq_component_id 
START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;