#!/bin/bash
# Script untuk hapus file SQL lama yang tidak diperlukan

echo "🗑️  Cleaning up old SQL files..."

# Hapus file SQL lama di root sql/
rm -f sql/00_ADD_STAFF_ENUM.sql
rm -f sql/CHECK_DATABASE.sql
rm -f sql/COMPLETE_MIGRATION.sql
rm -f sql/FIX_RLS_POLICIES.sql
rm -f sql/QUICK_FIX.sql
rm -f sql/SAFE_MIGRATION.sql
rm -f sql/VERIFICATION_QUERIES.sql

# Hapus file migrations lama
rm -f sql/migrations/001_create_core_tables.sql
rm -f sql/migrations/002_password_resets.sql
rm -f sql/migrations/003_qr_attendance.sql
rm -f sql/migrations/003_teacher_attendance.sql
rm -f sql/migrations/004_notifications.sql

echo "✅ Cleanup complete!"
echo "📋 Remaining files:"
ls -la sql/*.sql 2>/dev/null || echo "No SQL files in root"
ls -la sql/migrations/*.sql 2>/dev/null || echo "No SQL files in migrations"
