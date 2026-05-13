-- =============================================
-- PSX IntelliTrade AI
-- 04_auth_procedures.sql
-- =============================================

-- REGISTER PROCEDURE
CREATE OR REPLACE PROCEDURE register_user(
    p_username  IN VARCHAR2,
    p_email     IN VARCHAR2,
    p_password  IN VARCHAR2,
    p_role      IN VARCHAR2 DEFAULT 'INVESTOR'
) AS
BEGIN
    INSERT INTO users (username, email, password_hash, role)
    VALUES (p_username, p_email, RAWTOHEX(UTL_RAW.CAST_TO_RAW(p_password)), p_role);
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('User registered: ' || p_username);
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        DBMS_OUTPUT.PUT_LINE('Error: Username or email already exists!');
END;
/

-- LOGIN FUNCTION
CREATE OR REPLACE FUNCTION psx_login(
    p_username  IN VARCHAR2,
    p_password  IN VARCHAR2
) RETURN VARCHAR2 AS
    v_role      VARCHAR2(10);
    v_hash      VARCHAR2(200);
BEGIN
    SELECT role, password_hash
    INTO v_role, v_hash
    FROM users
    WHERE username = p_username
    AND is_active = 1;

    IF v_hash = RAWTOHEX(UTL_RAW.CAST_TO_RAW(p_password)) THEN
        RETURN 'SUCCESS:' || v_role;
    ELSE
        RETURN 'ERROR:Invalid password';
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 'ERROR:User not found';
END;
/