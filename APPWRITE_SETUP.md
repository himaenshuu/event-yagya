# Appwrite Setup Instructions

## ✅ Current Status
- CORS Error: **FIXED** (localhost platform added)
- New Error: **401 Unauthorized** - Need to configure permissions

## Step 1: Get Your Table ID (formerly Collection ID)

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Select your project: **694d4f82000b90293d9c**
3. Navigate to **Databases** → Click on database **694d4fee0004a8ea4c4f**
4. You should see your tables listed
5. Click on the table (might be named "receipt" or "donations")
6. Copy the **Table ID** from the top of the page (it's a long alphanumeric string like `694d72bc001cf1f14f87`)

## Step 2: Fix 401 Unauthorized Error - Configure Permissions

The 401 error means your table doesn't allow public write access. You need to configure permissions:

### Option A: Allow Any User (Recommended for donations)
1. In Appwrite Console, go to your **Database** → **Tables**
2. Click on your table (ID: `694d72bc001cf1f14f87`)
3. Go to **Settings** tab
4. Scroll to **Permissions** section
5. Click **"Add Permission"**
6. Select **"Any"** role
7. Enable these permissions:
   - ✅ **Create** (to allow donations)
   - ✅ **Read** (to verify transactions)
8. Click **"Update"**

### Option B: Use API Key (For server-side operations)
If you want more control, you can use an API key:

1. Go to Project **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Name it: `Donation API`
4. Set scopes:
   - `databases.write`
   - `databases.read`
5. Copy the generated API key
6. Add to `.env.local`:
   ```
   VITE_APPWRITE_API_KEY=your_api_key_here
   ```

## Step 3: Add Web Platform (Fix CORS Error) ✅

**Already Done!** Your platform is configured correctly.

~~1. In Appwrite Console, go to your **Project Settings**
2. Click on **Platforms** tab
3. Click **"Add Platform"** → Select **"Web"**
4. Enter these details:
   - **Name**: Local Development
   - **Hostname**: `localhost` (NOT http://localhost:3000, just `localhost`)
5. Click **"Next"** or **"Save"**~~

## Step 4: Update .env.local File

Replace the value in `VITE_APPWRITE_COLLECTION_ID` (note: still called COLLECTION_ID for backwards compatibility) with the actual Table ID you copied.

## Step 5: Restart Dev Server

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

## Current Configuration

- **Project ID**: 694d4f82000b90293d9c ✅
- **Database ID**: 694d4fee0004a8ea4c4f ✅
- **Bucket ID**: 694d50760003519badde ✅
- **Table ID** (Collection ID): 694d72bc001cf1f14f87 ✅
- **Platform Hostname**: ✅ `localhost` (Configured!)
- **Permissions**: ⚠️ Need to configure (see Step 2)

## Troubleshooting

### 401 Unauthorized Error
- **Cause**: Table doesn't have proper permissions
- **Fix**: Follow Step 2 above to add "Any" role with Create/Read permissions

### CORS Error (if it returns)
1. Clear browser cache
2. Make sure you added just `localhost` (not the full URL)
3. Wait a few seconds for Appwrite to update
4. Restart your dev server

### Tailwind CSS Warning
The warning about `cdn.tailwindcss.com` is just for production. It's fine for development but you should install Tailwind properly before deploying.
