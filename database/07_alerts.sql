-- =============================================
-- PSX IntelliTrade AI
-- 07_alerts.sql
-- =============================================

CREATE OR REPLACE PROCEDURE generate_alerts AS
    v_count NUMBER;
BEGIN
    -- Check karo aaj ke alerts already hain?
    SELECT COUNT(*) INTO v_count
    FROM alerts
    WHERE TRUNC(created_at) = TRUNC(SYSDATE);
    
    -- Agar aaj ke alerts already hain tu generate mat karo
    IF v_count > 0 THEN
        DBMS_OUTPUT.PUT_LINE('Alerts already generated for today!');
        RETURN;
    END IF;
    
    -- Price drop alerts
    INSERT INTO alerts (company_id, alert_type, message)
    SELECT company_id, 'PRICE DROP', 
           'Stock dropped more than 5% today!'
    FROM top_gainers_losers
    WHERE pct_change < -5;

    -- Price spike alerts
    INSERT INTO alerts (company_id, alert_type, message)
    SELECT company_id, 'PRICE SPIKE', 
           'Stock gained more than 5% today!'
    FROM top_gainers_losers
    WHERE pct_change > 5;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Alerts generated successfully!');
END;
/