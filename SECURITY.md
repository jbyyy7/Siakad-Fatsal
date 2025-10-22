# ⚠️ Security Advisory - Known Vulnerabilities

## High Priority

### 1. xlsx (SheetJS) - Prototype Pollution & ReDoS
**Severity:** HIGH  
**Package:** xlsx@0.18.5  
**Status:** ❌ No fix available yet  
**CVSS:** https://github.com/advisories/GHSA-4r6h-8v6p-xvw6

**Impact:**
- Prototype pollution vulnerability
- Regular Expression Denial of Service (ReDoS)
- Used in: Import Siswa feature (Excel/CSV parsing)

**Mitigation:**
1. **Short-term:**
   - Limit file upload size (max 5MB)
   - Sanitize Excel data sebelum processing
   - Rate limit import endpoint
   - Monitor memory usage

2. **Long-term:**
   - Migrate to safer alternative: `exceljs` atau `papaparse` (untuk CSV only)
   - Implement server-side file scanning
   - Add file type validation (reject macros)

**Code Changes Required:**
```typescript
// Before (current)
import * as XLSX from 'xlsx';

// After (recommended)
import * as Papa from 'papaparse'; // for CSV
import { Workbook } from 'exceljs'; // for Excel
```

---

### 2. Vite & Vitest - Moderate Vulnerabilities
**Severity:** MODERATE (4 issues)  
**Status:** ⚠️ Update required  
**Current:** vite@5.0.0, vitest@1.1.5  
**Recommended:** Latest stable versions

**Fix:**
```bash
npm update vite @vitejs/plugin-react
npm update vitest
```

---

## Accepted Risks (For Now)

### Development Dependencies
- ESLint 8.x (deprecated, but no security impact in production)
- rimraf, inflight, glob (deprecated warnings only)

**Rationale:** These only run during development, not included in production bundle.

---

## Security Best Practices Implemented

✅ **Input Validation**
- Email format validation
- Phone number format validation
- File type restrictions

✅ **Authentication**
- Supabase Auth with RLS
- Password reset token expiry (24h)
- Session management

✅ **API Security**
- Secret-based endpoint protection
- Rate limiting (recommended to add)
- CORS configuration

✅ **Data Protection**
- Passwords never stored/returned plaintext
- Server-only secrets separated
- RLS on all sensitive tables

---

## Recommendations

### Immediate Actions
1. Add rate limiting middleware
2. Implement file size limits (max 5MB uploads)
3. Add input sanitization library (DOMPurify for HTML, validator.js for strings)

### Code Examples

**File Upload Limits:**
```typescript
// api/import-students.ts
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > MAX_FILE_SIZE) {
    return res.status(413).json({ error: 'File too large (max 5MB)' });
  }
  // ... rest of handler
}
```

**Rate Limiting:**
```typescript
// middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});
```

---

**Last Updated:** October 22, 2025  
**Next Review:** November 2025 (or when xlsx releases patch)
