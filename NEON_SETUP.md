# 🚀 Neon Database Setup Guide

Neon is a serverless PostgreSQL database that works perfectly with Vercel. It's free and easy to set up!

---

## Step 1: Create Neon Account

1. **Go to:** https://neon.tech
2. **Sign up** (free account)
3. **Sign in** to your account

---

## Step 2: Create a Project

1. **Click "Create Project"**
2. **Fill in:**
   - Project name: `meatbirdz` (or any name)
   - Region: Choose closest to you (e.g., `US East`)
   - PostgreSQL version: `15` (default is fine)
3. **Click "Create Project"**

---

## Step 3: Get Connection String

1. **After project is created**, you'll see a dashboard
2. **Look for "Connection String"** section
3. **Click "Connection string"** dropdown
4. **Select "Pooled connection"** (recommended for Vercel)
5. **Copy the connection string**

It will look like:
```
postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

---

## Step 4: Update Vercel Environment Variables

1. **Go to Vercel → Settings → Environment Variables**

2. **Add POSTGRES_URL:**
   - Key: `POSTGRES_URL`
   - Value: Paste the Neon connection string you copied
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

3. **Also add DATABASE_URL** (for compatibility):
   - Key: `DATABASE_URL`
   - Value: Same Neon connection string
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

---

## Step 5: Push Code and Deploy

```bash
git push
```

Wait for Vercel to deploy.

---

## Step 6: Set Up Database Tables

After deployment, call the setup endpoint:

```
https://meatbirdz.vercel.app/api/setup-db
```

Or use curl:
```bash
curl -X POST https://meatbirdz.vercel.app/api/setup-db \
  -H "Authorization: Bearer setup-token-12345"
```

This will:
- ✅ Create all tables
- ✅ Seed 50+ menu items
- ✅ Create test users

---

## Step 7: Verify It Works

1. **Check connection:**
   - Visit: `https://meatbirdz.vercel.app/api/test-db`
   - Should show connection success

2. **Check menu:**
   - Visit: `https://meatbirdz.vercel.app/menu`
   - Should show all menu items

---

## Benefits of Neon

✅ **Free tier** - Generous limits  
✅ **Serverless** - Auto-scaling  
✅ **Fast** - Global edge network  
✅ **Easy setup** - Just copy connection string  
✅ **Works perfectly with Vercel** - No connection issues  

---

## Troubleshooting

### Connection string format:
Make sure it includes `?sslmode=require` at the end

### If connection fails:
- Double-check the connection string is correct
- Make sure you copied the "Pooled connection" string
- Verify environment variables are set in Vercel
- Redeploy after adding environment variables

---

That's it! Neon is much easier than Supabase and works perfectly with Vercel! 🎉

