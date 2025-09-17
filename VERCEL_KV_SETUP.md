# Vercel KV Setup Instructions

## Quick Setup

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Link your project to Vercel**:
   ```bash
   vercel link
   ```

3. **Create a KV database**:
   ```bash
   vercel storage create kv-store --type kv
   ```

4. **Pull environment variables**:
   ```bash
   vercel env pull .env.local
   ```

## Manual Setup (via Dashboard)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to the **Storage** tab
4. Click **Create Database** → Select **KV**
5. Name your database (e.g., "fast-track-kv")
6. Click **Create**

### Get your credentials:

1. After creating the database, go to your KV database settings
2. Find the **Environment Variables** section
3. Copy these values:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

4. Add them to your `.env.local` file:
   ```env
   KV_REST_API_URL=https://your-kv-url.kv.vercel-storage.com
   KV_REST_API_TOKEN=your-token-here
   ```

## Local Development

For local development, you have two options:

### Option 1: Use Production KV (Recommended)
- Uses your actual Vercel KV database
- Data persists between sessions
- Costs may apply based on usage

### Option 2: Use Upstash Redis locally
1. Create a free account at [Upstash](https://upstash.com)
2. Create a Redis database
3. Use the Upstash credentials in your `.env.local`

## Verify Setup

Run your development server:
```bash
npm run dev
```

Your sessions should now sync across devices using the session URLs!

## Deployment

When deploying to Vercel, the KV environment variables will be automatically available if you created the KV database through the Vercel dashboard.

## Troubleshooting

If you see "Missing required environment variables":
1. Make sure `.env.local` exists and contains the KV variables
2. Restart your development server after adding variables
3. Verify the variables are correct using `vercel env ls`

## Costs

- Vercel KV has a free tier with:
  - 3000 requests per day
  - 256MB storage
  - 1GB bandwidth
- This should be sufficient for personal use
- Monitor usage in your Vercel dashboard under Storage → Your KV Database → Usage