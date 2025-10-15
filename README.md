<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/17BfL95lmITG2qAz00Zqac5C0SorTGRUW

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env` file from the provided example and set required values:
   - Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - (Optional) Add `GEMINI_API_KEY` if you use the AI features.

   Example:

   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

3. Run the app locally:
   `npm run dev`

Deployment notes (Vercel):
- When deploying to Vercel, set the environment variables in Project Settings -> Environment Variables using the same names (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- For server-side functions or RPCs that require elevated privileges, do not expose the Service Role key to the client. Implement serverless functions or Supabase RPCs with appropriate policies.

Server-side endpoints (Vercel)
--------------------------------
This project includes example serverless endpoints under `api/` to perform sensitive operations (create user, delete user) using the Supabase Service Role key. These endpoints are meant to run on Vercel (or other serverless hosts).

Environment vars to set in Vercel:
- `VITE_SUPABASE_URL` - Supabase project URL (same as client)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (NEVER commit this to git)
- `CREATE_USER_SECRET` - a random shared secret sent as header `x-create-user-secret` when calling `/api/create-user`
- `DELETE_USER_SECRET` - similarly for `/api/delete-user` header `x-delete-user-secret`

Rotation & safety tips
----------------------
- After removing keys from source code, rotate the Supabase anon key and service role key from the Supabase Dashboard.
- Store the new keys in Vercel Environment Variables (Project Settings -> Environment Variables).
- Limit the use of the service role key only to server-side code (serverless functions, admin scripts). Never expose it to the browser.
- If you suspect leakage, rotate keys immediately and update env values.

Calling the endpoints
---------------------
Example of creating a user (server-to-server):

```js
fetch('https://your-deployment-url/api/create-user', {
   method: 'POST',
   headers: {
      'Content-Type': 'application/json',
      'x-create-user-secret': process.env.CREATE_USER_SECRET
   },
   body: JSON.stringify({
      email: 'user@example.com',
      password: 'secure-password',
      profile: { full_name: 'Nama', identity_number: '12345', role: 'Siswa' }
   })
})
.then(r => r.json()).then(console.log)
```

Running tests
-------------
This project includes a small test scaffold using Vitest. To run tests locally:

```bash
npm install
npm run test
```


