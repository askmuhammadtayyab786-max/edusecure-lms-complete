# EduSecure LMS — Database Setup

Run these in order.

## 1. Create the database and tables (as root/admin MySQL user)
```bash
mysql -u root -p < schema.sql
```

## 2. Create the least-privilege application user
Edit `create_app_user.sql` first and replace `CHANGE_ME_TO_A_STRONG_PASSWORD`
with a real, unique password. Then run:
```bash
mysql -u root -p < create_app_user.sql
```

## 3. Put the same credentials in the backend's `.env`
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=edusecure_app
DB_PASSWORD=<the password you set above>
DB_NAME=edusecure_lms
```

## 4. Seed the first Admin account
```bash
mysql -u root -p < seed_admin.sql
```
Login: `admin@edusecure.lms` / `ChangeMe123!`
**Change this password immediately after first login** — a route to do
this can be added to `adminController.js` (change-own-password), or update
the `password_hash` directly via a fresh bcrypt hash.

## 5. Verify the app user's privileges (should NOT include DROP/ALTER/GRANT)
```sql
SHOW GRANTS FOR 'edusecure_app'@'%';
```
Expected output only shows `SELECT, INSERT, UPDATE, DELETE`.

## 6. Start the backend
```bash
cd ../
npm install
cp .env.example .env   # then edit with your real DB credentials + JWT secrets
npm run dev
```
Check `GET /health` returns `{"status":"ok"}` and the console shows
`MySQL connection pool OK`.
