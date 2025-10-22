-- =====================================================
-- ADD STAFF TO USER_ROLE ENUM
-- RUN THIS FIRST, BEFORE ANY OTHER MIGRATION!
-- Must be in separate transaction due to PostgreSQL limitation
-- =====================================================

-- Add Staff to the user_role enum type
DO $$ 
BEGIN
    -- Check if Staff value already exists in enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Staff' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'Staff';
        RAISE NOTICE '✅ Added Staff to user_role enum';
    ELSE
        RAISE NOTICE '✓ Staff already exists in user_role enum';
    END IF;
END $$;

-- Verify enum values
DO $$ 
DECLARE
    enum_values text;
BEGIN
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder) INTO enum_values
    FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');
    
    RAISE NOTICE 'Current user_role values: %', enum_values;
END $$;

-- Success
DO $$ 
BEGIN 
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ENUM UPDATE COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next: Run QUICK_FIX.sql';
    RAISE NOTICE 'Then: Run COMPLETE_MIGRATION.sql';
    RAISE NOTICE '========================================';
END $$;
