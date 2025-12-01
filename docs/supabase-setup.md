# Supabase Integration Setup Guide

This guide walks through setting up Supabase backend for WrathWord.

## Prerequisites

- Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js 18+ installed
- React Native development environment set up

## Setup Options

You can set up Supabase using either:

### Option A: Supabase MCP (Recommended - AI-Assisted)

If you have the Supabase MCP server configured in Cursor, AI assistants can help automate much of the setup:

1. **Configure Supabase MCP**: Add to your Cursor MCP settings:
   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-supabase"]
       }
     }
   }
   ```

2. **Provide Credentials**: The MCP will need your Supabase project credentials

3. **AI-Assisted Setup**: Request AI assistance to:
   - Run migrations automatically
   - Create tables and policies
   - Set up authentication
   - Configure RLS policies
   - Test connections

**Advantages**: Faster, less error-prone, automated verification

### Option B: Manual Setup (Traditional)

Follow the steps below if you prefer manual control or don't have MCP configured.

## Step 1: Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Project Name**: WrathWord
   - **Database Password**: (generate a strong password and save it)
   - **Region**: Choose closest to your users
4. Wait for project to initialize (~2 minutes)

## Step 2: Run Database Migrations

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. Apply migrations:
```bash
supabase db push
```

### Option B: Using SQL Editor

1. Go to your project dashboard → SQL Editor
2. Copy content from `supabase/migrations/00001_initial_schema.sql`
3. Paste and run in SQL Editor
4. Repeat for `00002_rls_policies.sql` and `00003_functions.sql`

## Step 3: Get API Credentials

1. In Supabase dashboard, go to Settings → API
2. Copy the following:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...` (long string starting with eyJ)

## Step 4: Configure Environment Variables

### For Development (React Native)

Create `.env` file in project root:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key-here
```

### For Production Build

#### iOS (Xcode)

1. Open `ios/WrathWord.xcworkspace`
2. Select your target → Build Settings
3. Add user-defined settings:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

#### Android (Gradle)

Edit `android/gradle.properties`:

```properties
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key-here
```

## Step 5: Enable Authentication

1. In Supabase dashboard, go to Authentication → Providers
2. Enable **Email** provider
3. Configure email templates (optional):
   - Go to Authentication → Email Templates
   - Customize confirmation and reset emails

### Optional: Enable Social Auth

For Google Sign-In:
1. Go to Authentication → Providers
2. Enable Google
3. Add OAuth credentials from Google Cloud Console

For Apple Sign-In:
1. Enable Apple provider
2. Configure Apple Developer settings

## Step 6: Test Authentication Locally

### Switch to Production Mode

In `src/config/environment.ts`, temporarily change:

```typescript
export const isDevelopment = false; // Set to false for testing
```

**Important**: Remember to set this back to `true` for development!

### Test Sign Up

1. Run your app: `npm run ios` or `npm run android`
2. You should see the Sign Up screen
3. Create a test account
4. Check Supabase dashboard → Authentication → Users
5. Your test user should appear

### Test Sign In

1. Sign out from the app
2. Sign in with test credentials
3. Verify you can access the app

## Step 7: Verify Database Setup

### Check Tables

1. Go to Table Editor in Supabase dashboard
2. Verify these tables exist:
   - `profiles`
   - `game_stats`
   - `game_results`
   - `friendships`
   - `friend_requests`

### Check RLS Policies

1. Go to Authentication → Policies
2. Each table should have multiple policies enabled
3. Test by trying to query data in SQL Editor

### Test Data Sync

1. Play a game in the app (while in prod mode)
2. Check Table Editor → `game_results`
3. Your game result should appear

## Step 8: Production Deployment

### Environment Configuration

Create production build with proper environment variables:

**iOS**:
```bash
cd ios
xcodebuild -workspace WrathWord.xcworkspace -scheme WrathWord -configuration Release
```

**Android**:
```bash
cd android
./gradlew assembleRelease
```

### Switch Mode Control

To enable production mode in builds:

1. Set environment variables in build system
2. Or modify `src/config/environment.ts` to read from build configs

## Troubleshooting

### "Supabase not configured" Error

**Problem**: App shows this error when trying to auth.

**Solution**:
1. Verify `.env` file exists with correct credentials
2. Restart Metro bundler: `npm start --reset-cache`
3. Rebuild app completely

### RLS Policy Violations

**Problem**: "new row violates row-level security policy"

**Solution**:
1. Check policies are applied correctly
2. Verify user is authenticated before operations
3. Run `supabase/migrations/00002_rls_policies.sql` again

### Can't Create Account

**Problem**: Sign up fails with generic error.

**Solution**:
1. Check email format is valid
2. Verify Supabase email provider is enabled
3. Check Supabase logs: Dashboard → Logs → Auth logs

### Stats Not Syncing

**Problem**: Game stats don't appear in Supabase.

**Solution**:
1. Ensure `isDevelopment = false` in prod mode
2. Check user is authenticated
3. View network requests in React Native Debugger
4. Check Supabase logs for errors

## Security Checklist

Before going to production:

- [ ] All RLS policies are enabled and tested
- [ ] Anon key is used (not service role key)
- [ ] Email confirmation is required
- [ ] Password requirements are set
- [ ] Rate limiting is configured
- [ ] Environment variables are not committed to git
- [ ] HTTPS is enforced for all API calls

## Next Steps

- Set up email templates for better UX
- Configure password reset flow
- Add social authentication providers
- Set up Supabase Edge Functions for complex operations
- Configure backups and monitoring

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com/)
- [React Native Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)

