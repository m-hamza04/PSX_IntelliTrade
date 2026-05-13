-- =============================================
-- PSX IntelliTrade AI
-- 05_triggers.sql
-- =============================================

CREATE OR REPLACE TRIGGER trg_update_holdings
AFTER INSERT ON transactions
FOR EACH ROW
DECLARE
    v_holding_id    NUMBER;
    v_quantity      NUMBER;
    v_avg_price     NUMBER;
    v_invested      NUMBER;
BEGIN
    SELECT holding_id, quantity, avg_buy_price, total_invested
    INTO v_holding_id, v_quantity, v_avg_price, v_invested
    FROM holdings
    WHERE portfolio_id = :NEW.portfolio_id
    AND company_id = :NEW.company_id;

    IF :NEW.trans_type = 'BUY' THEN
        UPDATE holdings
        SET quantity = quantity + :NEW.quantity,
            avg_buy_price = (total_invested + :NEW.total_amount) / (quantity + :NEW.quantity),
            total_invested = total_invested + :NEW.total_amount
        WHERE holding_id = v_holding_id;
    ELSIF :NEW.trans_type = 'SELL' THEN
        UPDATE holdings
        SET quantity = quantity - :NEW.quantity,
            total_invested = total_invested - (:NEW.quantity * avg_buy_price)
        WHERE holding_id = v_holding_id;
    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        IF :NEW.trans_type = 'BUY' THEN
            INSERT INTO holdings (portfolio_id, company_id, quantity, avg_buy_price, total_invested)
            VALUES (:NEW.portfolio_id, :NEW.company_id, :NEW.quantity, :NEW.price, :NEW.total_amount);
        END IF;
END;
/