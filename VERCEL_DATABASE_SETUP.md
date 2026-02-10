# 🚀 Quick Setup: Connect Vercel to Supabase

## Step 1: Add DATABASE_URL to Vercel (2 minutes)

1. **Go to Vercel Dashboard:**
   - Open: https://vercel.com
   - Sign in → Click your project `meatbirdz`

2. **Go to Environment Variables:**
   - Click **Settings** tab (top)
   - Click **Environment Variables** (left sidebar)

3. **Add DATABASE_URL:**
   - Click **"Add New"** button
   - **Key:** `DATABASE_URL`
   - **Value:** Copy and paste this EXACT string:
     ```
     postgresql://postgres:Birmingham%401990UK@db.yiohxhevppxqvylgptiw.supabase.co:5432/postgres
     ```
   - **Environment:** Check ALL three boxes:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Click **"Save"**

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click three dots (⋯) on latest deployment
   - Click **"Redeploy"**
   - Wait for deployment to complete

---

## Step 2: Set Up Database Tables (1 minute)

After deployment completes, call this URL in your browser:

```
https://meatbirdz.vercel.app/api/setup-db
```

**Or use curl:**
```bash
curl -X POST https://meatbirdz.vercel.app/api/setup-db \
  -H "Authorization: Bearer setup-token-12345"
```

This will:
- ✅ Create all database tables
- ✅ Seed menu items
- ✅ Set up test users

---

## Step 3: Verify Connection

Visit this URL to check if connection works:

```
https://meatbirdz.vercel.app/api/test-db
```

You should see:
```json
{
  "connected": true,
  "database": {
    "tables": ["MenuItem", "User", "Order", "OrderItem"],
    "menuItemCount": 50
  }
}
```

---

## That's It! 🎉

Your Vercel app is now connected to Supabase and ready to use!

**Connection String (for reference):**
```
postgresql://postgres:Birmingham%401990UK@db.yiohxhevppxqvylgptiw.supabase.co:5432/postgres
```

**Note:** The password `Birmingham@1990UK` is URL-encoded as `Birmingham%401990UK` (the `@` becomes `%40`)

