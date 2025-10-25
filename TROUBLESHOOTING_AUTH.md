# 🔧 Troubleshooting Authentication Issues

## ❌ Error: "Email not confirmed"

### Deskripsi Error:
```
Email not confirmed
POST https://xxx.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
```

### Penyebab:
User baru yang dibuat belum verifikasi email mereka. Supabase Auth secara default memerlukan konfirmasi email.

---

## ✅ Solusi 1: Disable Email Confirmation (Recommended untuk Internal App)

### Untuk Development/Testing/Internal School System:

**Langkah:**
1. Buka **Supabase Dashboard**: https://supabase.com/dashboard
2. Pilih project Anda
3. Navigation: **Authentication** → **Settings**
4. Scroll ke section **"Email Auth"**
5. **UNCHECK/DISABLE**: ☐ Enable email confirmations
6. Klik **Save**

**Kapan menggunakan:**
- ✅ Aplikasi internal sekolah (staff/admin yang mengelola user)
- ✅ Environment development
- ✅ Tidak perlu verifikasi email karena admin yang membuat akun

**Keuntungan:**
- User bisa langsung login setelah dibuat
- Tidak perlu setup email SMTP
- Cocok untuk aplikasi internal

---

## ✅ Solusi 2: Konfirmasi Email Manual (Quick Fix)

### Untuk User yang Sudah Dibuat:

**Langkah:**
1. Buka **Supabase Dashboard**
2. **Authentication** → **Users**
3. Cari user yang error (email belum confirmed)
4. Klik pada user tersebut
5. Klik icon **"..." (three dots)** di kanan atas
6. Pilih **"Confirm email"** atau **"Send confirmation email"**
7. User sekarang bisa login ✅

**Kapan menggunakan:**
- User spesifik yang sudah dibuat tapi tidak bisa login
- Quick fix untuk 1-2 user
- Saat menunggu setup SMTP email

---

## ✅ Solusi 3: Auto-Confirm via Code (Sudah Diimplementasi)

### Cara Kerja di `api/create-user.ts`:

```typescript
// Email auto-confirmed saat create user
await serverSupabase.auth.admin.createUser({
  email,
  password: password || 'random-secure-password',
  email_confirm: true, // ← AUTO-CONFIRM (no verification needed)
  user_metadata: {
    full_name: profile.full_name,
    role: profile.role
  }
});
```

**Status:** ✅ **SUDAH AKTIF** di kode Anda

**Catatan:** Meskipun code sudah benar, Supabase Dashboard setting **TETAP HARUS** disable email confirmation (Solusi 1) untuk user bisa langsung login.

---

## ✅ Solusi 4: Setup Email SMTP (Production)

### Untuk Production dengan Email Verification:

**Jika Anda ingin kirim email konfirmasi real:**

1. **Setup SMTP di Supabase:**
   - Dashboard → **Settings** → **Auth**
   - Scroll ke **"SMTP Settings"**
   - Pilih provider: SendGrid, AWS SES, Resend, atau Custom SMTP

2. **Konfigurasi Email Templates:**
   - **Authentication** → **Email Templates**
   - Customize template "Confirm signup"
   - Test kirim email

3. **Enable Email Confirmation:**
   - **Authentication** → **Settings**
   - ✅ CHECK: Enable email confirmations
   - Save

**Kapan menggunakan:**
- Production app dengan user publik
- Butuh validasi email real
- Security requirement tinggi

---

## 🔄 Flow Comparison

### Without Email Confirmation (Internal App):
```
Admin membuat user → User langsung bisa login ✅
```

### With Email Confirmation (Public App):
```
Admin membuat user → Email terkirim → User klik link → User bisa login ✅
```

---

## 🎯 Recommended Setup untuk SIAKAD (Internal School System)

**Pilihan Terbaik:** ✅ **Solusi 1 (Disable Email Confirmation)**

**Alasan:**
1. ✅ Admin/Staff yang membuat akun guru dan siswa
2. ✅ Tidak perlu validasi email karena data sudah diverifikasi manual
3. ✅ Lebih simpel untuk user (langsung login)
4. ✅ Tidak perlu setup SMTP (save cost)
5. ✅ User experience lebih baik (no extra step)

**Langkah Implementation:**
```bash
1. Supabase Dashboard → Authentication → Settings
2. Disable "Enable email confirmations"
3. User baru bisa langsung login ✅
```

---

## 🐛 Debugging Checklist

Jika masih error setelah disable email confirmation:

- [ ] **Check Supabase Settings saved?**
  - Refresh dashboard, pastikan setting tersimpan

- [ ] **Clear browser cache/cookies?**
  - Logout semua user
  - Clear browser cache
  - Try login lagi

- [ ] **Check user di Dashboard:**
  - Authentication → Users
  - Lihat kolom "Email Confirmed At"
  - Jika NULL, confirm manual (Solusi 2)

- [ ] **Check API response:**
  - Browser DevTools → Network tab
  - Lihat response body dari `/auth/v1/token`
  - Jika masih "Email not confirmed", setting belum apply

- [ ] **Try create NEW user:**
  - Jangan test dengan user lama
  - Buat user baru setelah disable confirmation
  - Test login dengan user baru

---

## 📝 Error Messages dan Solusinya

| Error Message | Penyebab | Solusi |
|---------------|----------|--------|
| `Email not confirmed` | Email confirmation enabled | Disable di settings |
| `Invalid login credentials` | Password salah atau user tidak exist | Reset password |
| `Email rate limit exceeded` | Terlalu banyak login attempt | Tunggu 1 jam |
| `User not found` | User belum dibuat di auth.users | Check database |
| `Invalid email` | Format email salah | Gunakan email valid |

---

## 🔐 Security Notes

### Disable Email Confirmation - Aman untuk:
- ✅ Internal company/school apps
- ✅ Admin-managed user creation
- ✅ Trusted network environment

### Email Confirmation - Wajib untuk:
- ❌ Public-facing apps
- ❌ Self-registration systems
- ❌ E-commerce/sensitive data

**Kesimpulan:** Untuk SIAKAD (internal sekolah), **disable email confirmation is SAFE and RECOMMENDED** ✅

---

## 📞 Need Help?

**Quick Fix NOW:**
1. Supabase Dashboard → Authentication → Settings
2. Disable "Enable email confirmations"
3. Click Save
4. Reload app
5. Try login ✅

**Jika masih error:**
- Check Supabase project URL correct?
- Check Supabase anon key di `.env`
- Check user exist di Authentication → Users
- Try clear browser cache + cookies

---

**Last Updated:** October 25, 2025
**Tested on:** Supabase Auth v2.x
**App:** SIAKAD Fatsal
