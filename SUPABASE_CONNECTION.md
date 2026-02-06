# How to Get Supabase Database Connection String

## Step-by-Step Instructions

### Step 1: Log into Supabase
1. Go to https://supabase.com
2. Sign in to your account
3. You'll see your project dashboard

### Step 2: Navigate to Database Settings
1. In the left sidebar, click on **Settings** (gear icon ⚙️)
2. Click on **Database** (under Project Settings)

### Step 3: Find Connection String
1. Scroll down to the section called **"Connection string"** or **"Connection pooling"**
2. You'll see different connection options:
   - **URI** (recommended)
   - **JDBC**
   - **Golang**
   - **Node.js**
   - **Python**
   - **etc.**

### Step 4: Copy the URI Connection String
1. Click on the **"URI"** tab
2. You'll see a connection string that looks like this:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
   OR
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

3. **Important**: Replace `[YOUR-PASSWORD]` with the actual password you set when creating the project
   - If you forgot your password, you can reset it in the same settings page

4. Click the **copy icon** (📋) next to the connection string, or select all text and copy it

### Step 5: Replace Password Placeholder
The copied string might have `[YOUR-PASSWORD]` placeholder. Replace it with your actual database password:

**Example:**
- If your password is `MySecurePassword123`
- And the string is: `postgresql://postgres:[YOUR-PASSWORD]@...`
- Replace it with: `postgresql://postgres:MySecurePassword123@...`

### Step 6: Save It Securely
- Save this connection string in a safe place
- You'll need it for Vercel environment variables
- **Never commit this to GitHub** (it's already in `.gitignore`)

---

## Visual Guide

```
Supabase Dashboard
├── Left Sidebar
│   └── Settings ⚙️
│       └── Database
│           └── Connection string section
│               └── URI tab ← Click here
│                   └── Copy button 📋
```

---

## Two Types of Connection Strings

### Option 1: Connection Pooling (Recommended for Vercel)
- Port: `6543`
- Format: `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres`
- **Use this one** - better for serverless environments like Vercel

### Option 2: Direct Connection
- Port: `5432`
- Format: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
- Use if pooling doesn't work

---

## Quick Checklist

- [ ] Logged into Supabase
- [ ] Clicked Settings → Database
- [ ] Found "Connection string" section
- [ ] Clicked "URI" tab
- [ ] Copied the connection string
- [ ] Replaced `[YOUR-PASSWORD]` with actual password
- [ ] Saved it securely

---

## Example Connection String

After replacing the password, it should look like:

```
postgresql://postgres.abcdefghijklmnop:[MyPassword123]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

**Note**: The actual string will have:
- Your project ID (instead of `abcdefghijklmnop`)
- Your region (instead of `us-west-1`)
- Your actual password (instead of `MyPassword123`)

---

## Troubleshooting

### Can't find Connection String?
- Make sure you're in the correct project
- Check that the project has finished creating (can take 2-3 minutes)
- Try refreshing the page

### Forgot Password?
1. Go to Settings → Database
2. Scroll to "Database password"
3. Click "Reset database password"
4. Save the new password
5. Update your connection string with the new password

### Connection String Not Working?
- Make sure you replaced `[YOUR-PASSWORD]` with actual password
- Try the connection pooling URL (port 6543) instead of direct (port 5432)
- Check that your project is active (not paused)

---

## Next Step

Once you have the connection string, add it to Vercel:
1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Add: `DATABASE_URL` = [paste your connection string]
4. Save and redeploy

