-- =====================================================
-- DELETE USER FUNCTION
-- =====================================================
-- Create function to delete user from auth and profiles
-- =====================================================

-- Drop existing function if any
DROP FUNCTION IF EXISTS delete_user(UUID);
DROP FUNCTION IF EXISTS delete_user(TEXT);

-- Create new function with correct parameter name
CREATE OR REPLACE FUNCTION delete_user(uid UUID)
RETURNS void AS $$
BEGIN
  -- Delete from auth.users (will cascade to profiles due to FK)
  DELETE FROM auth.users WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_user(UUID) TO authenticated;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ delete_user(uid UUID) function created successfully!';
  RAISE NOTICE '✅ Usage: SELECT delete_user(''user-uuid-here'')';
END $$;
