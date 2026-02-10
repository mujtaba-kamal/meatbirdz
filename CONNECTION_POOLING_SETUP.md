# 🔗 Connection Pooling Setup for Vercel

Use these connection strings for better reliability with Vercel.

## Connection Strings

### For Vercel Environment Variables:

**DATABASE_URL** (Connection Pooling - for app queries):
```
postgresql://postgres.yiohxhevppxqvylgptiw:Birmingham%401990UK@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**DIRECT_URL** (Direct Connection - for migrations):
```
postgresql://postgres.yiohxhevppxqvylgptiw:Birmingham%401990UK@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
```

**Important:** 
- Password is URL-encoded: `Birmingham%401990UK` (the `@` becomes `%40`)
- Both URLs use the same password

## Steps to Set Up in Vercel

1. **Go to Vercel → Settings → Environment Variables**

2. **Add DATABASE_URL:**
   - Key: `DATABASE_URL`
   - Value: `postgresql://postgres.yiohxhevppxqvylgptiw:Birmingham%401990UK@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

3. **Add DIRECT_URL:**
   - Key: `DIRECT_URL`
   - Value: `postgresql://postgres.yiohxhevppxqvylgptiw:Birmingham%401990UK@aws-1-eu-west-2.pooler.supabase.com:5432/postgres`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

4. **Redeploy:**
   - Go to Deployments
   - Click ⋯ on latest deployment
   - Click "Redeploy"

## What Changed

- ✅ Prisma schema now supports both `DATABASE_URL` (pooling) and `DIRECT_URL` (migrations)
- ✅ Connection pooling URL uses port 6543 (better for serverless)
- ✅ `pgbouncer=true` parameter enables connection pooling

After redeploying with these URLs, the connection should work!

