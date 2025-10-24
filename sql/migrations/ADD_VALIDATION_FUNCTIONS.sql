-- =====================================================
-- ADD VALIDATION FUNCTIONS
-- =====================================================
-- Description: Menambahkan functions untuk validasi email dan nomor induk
-- Run this in Supabase SQL Editor jika database sudah ada dan error "function not found"
-- =====================================================

-- Function untuk validasi nomor induk (NIS/NIP/NIK) - cek apakah sudah digunakan
CREATE OR REPLACE FUNCTION get_email_from_identity(identity_number_input TEXT)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Cari email berdasarkan identity_number
    SELECT email INTO user_email
    FROM profiles
    WHERE identity_number = identity_number_input
    LIMIT 1;
    
    RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_email_from_identity IS 'Mengecek apakah nomor induk sudah digunakan dan mengembalikan email terkait';

-- Function untuk validasi email - cek apakah sudah digunakan
CREATE OR REPLACE FUNCTION check_email_exists(email_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    email_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO email_count
    FROM profiles
    WHERE email = email_input;
    
    RETURN email_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_email_exists IS 'Mengecek apakah email sudah terdaftar dalam sistem';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_email_from_identity(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO authenticated, anon, service_role;

-- Test functions
DO $$
BEGIN
    RAISE NOTICE '✅ Validation functions created successfully!';
    RAISE NOTICE '📋 Functions: get_email_from_identity(), check_email_exists()';
    RAISE NOTICE '🔒 Security: DEFINER mode with proper grants';
END $$;
