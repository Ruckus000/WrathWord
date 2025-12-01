# Using Supabase MCP for Setup

This guide explains how to use the Supabase MCP (Model Context Protocol) server to automate Supabase setup for WrathWord.

## What is Supabase MCP?

The Supabase MCP is a Model Context Protocol server that allows AI assistants (like Claude in Cursor) to directly interact with your Supabase project. This enables automated:

- Database migrations
- Table creation
- RLS policy setup
- Function deployment
- Configuration verification

## Configuration

### Step 1: Add Supabase MCP to Cursor

1. Open Cursor Settings
2. Navigate to MCP section
3. Add Supabase MCP configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your-access-token-here",
        "SUPABASE_PROJECT_REF": "your-project-ref-here"
      }
    }
  }
}
```

### Step 2: Get Supabase Credentials

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create or select your project
3. Go to Settings → API
4. Copy:
   - **Project Reference ID** (from URL or Settings)
   - **Access Token** (generate from Settings → API → Access Tokens)

### Step 3: Update Configuration

Replace the placeholders in your MCP configuration:

- `your-access-token-here` → Your actual access token
- `your-project-ref-here` → Your actual project reference

## Using MCP for Setup

Once configured, you can request AI assistance with setup:

### Example Prompts

**Run all migrations**:

```
"Use the Supabase MCP to run all migration files from supabase/migrations/ in order"
```

**Verify setup**:

```
"Check if all tables exist in Supabase and RLS policies are applied"
```

**Test connection**:

```
"Test the Supabase connection and list all tables"
```

**Deploy specific migration**:

```
"Run the initial schema migration (00001_initial_schema.sql) using Supabase MCP"
```

## What MCP Can Automate

### ✅ Fully Automated

- Running SQL migrations
- Creating tables and indexes
- Setting up RLS policies
- Creating functions and triggers
- Verifying schema matches code
- Testing database connections

### ⚠️ Still Manual

- Creating Supabase project (must be done in dashboard)
- Getting API credentials for React Native app
- Configuring authentication providers
- Setting up environment variables in app

## Setup Workflow with MCP

1. **Create Project** (Manual):

   - Go to Supabase dashboard
   - Create new project
   - Wait for initialization

2. **Configure MCP** (One-time):

   - Add Supabase MCP to Cursor settings
   - Add credentials

3. **Run Migrations** (AI-Assisted):

   ```
   "Run all Supabase migrations in order using MCP"
   ```

4. **Verify Setup** (AI-Assisted):

   ```
   "Verify all tables and policies are correctly set up"
   ```

5. **Get App Credentials** (Manual):

   - Copy Project URL and Anon Key
   - Add to app's `.env` file

6. **Test** (AI-Assisted):
   ```
   "Test that the Supabase setup works with the app"
   ```

## Advantages of Using MCP

### Speed

- Migrations run in seconds
- No copy-paste errors
- Automated verification

### Accuracy

- SQL executed exactly as written
- Immediate error feedback
- Consistent results

### Debugging

- AI can inspect database state
- Query tables directly
- Verify RLS policies

### Iteration

- Quick schema changes
- Easy rollbacks
- Test different configurations

## Troubleshooting

### MCP Not Available

**Problem**: Cursor doesn't show Supabase MCP tools.

**Solution**:

1. Verify MCP configuration in Cursor settings
2. Restart Cursor completely
3. Check credentials are correct
4. Try manual setup as fallback

### Permission Errors

**Problem**: "Permission denied" when running migrations.

**Solution**:

- Verify access token has proper permissions
- Use service role key (not anon key) for migrations
- Check project reference is correct

### Migration Fails

**Problem**: Migration execution fails.

**Solution**:

- Check SQL syntax in migration files
- Verify dependencies (tables created in order)
- Run migrations one at a time
- Check Supabase logs

## Security Notes

### Access Token vs Anon Key

- **Access Token** (for MCP): Admin privileges, keep secret
- **Anon Key** (for app): Public, limited by RLS

### Best Practices

1. **Never commit access tokens** to git
2. **Use environment variables** for credentials
3. **Rotate tokens** periodically
4. **Use separate projects** for dev/staging/prod
5. **Review permissions** before granting access

## Comparison: MCP vs Manual

| Aspect         | MCP               | Manual            |
| -------------- | ----------------- | ----------------- |
| Speed          | ⚡ Fast (seconds) | 🐌 Slow (minutes) |
| Errors         | ✅ Catches early  | ⚠️ Easy to miss   |
| Learning Curve | 📚 Moderate       | 📖 Easier         |
| Debugging      | 🔍 AI-assisted    | 🔎 Self-guided    |
| Automation     | 🤖 High           | 👋 Low            |
| Control        | ⚙️ Good           | 🎛️ Full           |

## Recommended Approach

**For first-time setup**: Use MCP

- Faster and more reliable
- Immediate verification
- AI can help debug issues

**For learning**: Use manual approach

- Better understanding of Supabase
- Learn SQL and RLS concepts
- More control over process

**For production**: Use MCP with review

- Automate migrations
- Review changes before applying
- Test in staging first

## Example Session

Here's a complete setup session using MCP:

```
User: "Set up Supabase using MCP. Run the three migration files."

AI: "I'll run the Supabase migrations in order:
1. Running 00001_initial_schema.sql... ✅ Complete
2. Running 00002_rls_policies.sql... ✅ Complete
3. Running 00003_functions.sql... ✅ Complete

All migrations successful!
Tables created: profiles, game_stats, game_results, friendships, friend_requests
RLS policies: 15 policies applied
Functions: 4 helper functions created

Your Supabase database is ready. Next steps:
1. Copy Project URL and Anon Key to .env
2. Set isDevelopment = false
3. Test authentication"

User: "Verify all tables exist"

AI: "✅ Verified all tables:
- profiles (6 columns)
- game_stats (12 columns)
- game_results (9 columns)
- friendships (6 columns)
- friend_requests (5 columns)

All RLS policies are active. Ready for use!"
```

## Alternative: Supabase CLI

If MCP isn't available, you can use Supabase CLI:

```bash
# Install
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-ref

# Run migrations
supabase db push
```

This is less interactive than MCP but also automated.

## Next Steps

After successful setup with MCP:

1. Get app credentials from Supabase dashboard
2. Configure `.env` file in React Native app
3. Switch to production mode
4. Test authentication and data sync

See `supabase-setup.md` for complete app configuration steps.
