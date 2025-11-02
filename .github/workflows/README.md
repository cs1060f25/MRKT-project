# GitHub Actions CI/CD for Supabase Database

This directory contains GitHub Actions workflows for automated database testing and deployment.

## Workflows

### 1. `db-test.yml` - Automated Testing
**Triggers:**
- On pull requests that modify `supabase/**`
- On pushes to `main` branch

**What it does:**
- Starts local Supabase instance
- Runs all 190 database tests
- Comments test results on PR
- Blocks merge if tests fail

### 2. `db-deploy.yml` - Production Deployment
**Triggers:**
- On push to `main` branch when `supabase/migrations/**` changes

**What it does:**
- Links to production Supabase project
- Pushes all pending migrations
- Creates deployment summary

### 3. `db-test-manual.yml` - Manual Testing
**Triggers:**
- Manual trigger via GitHub Actions UI

**What it does:**
- Allows running all tests or a specific test file
- Useful for testing before creating a PR

## Required GitHub Secrets

Navigate to **Settings → Secrets and variables → Actions → New repository secret**

### Production Secrets

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `SUPABASE_ACCESS_TOKEN` | `sbp_a3ad3d3fb16594e593b769e672a958e76625b5b6` | API token for Supabase CLI |
| `SUPABASE_DB_PASSWORD` | `$qd.EH+4Pmc9Dj#` | Database password for production |
| `SUPABASE_PROJECT_REF` | `kgnpbrdrqsqpcyvzbhjx` | Production project reference ID |

## Setup Instructions

### 1. Add GitHub Secrets

```bash
# Go to: https://github.com/cs1060f25/MRKT-project/settings/secrets/actions

# Add each secret from the table above
```

### 2. Enable GitHub Actions

```bash
# Go to: https://github.com/cs1060f25/MRKT-project/settings/actions

# Ensure Actions are enabled for the repository
```

### 3. (Optional) Enable Branch Protection

```bash
# Go to: https://github.com/cs1060f25/MRKT-project/settings/branches

# Add rule for 'main' branch:
# - Require status checks to pass: ✅ Database Tests
# - Require branches to be up to date: ✅
```

## Local Development

Run tests locally before pushing:

```bash
# Reset DB and run all tests
npm run db:test

# Or run tests without reset
npm run db:test:all

# Push to production (manual)
npm run db:push
```

## Test Coverage

| Test Suite | Tests | Purpose |
|------------|-------|---------|
| `01_schema_pgtap.sql` | 104 | Schema structure, constraints, indices |
| `02_rls_pgtap.sql` | 37 | Row Level Security policies |
| `03_rpc_surface_pgtap.sql` | 18 | RPC function signatures |
| `04_rpc_functions_pgtap.sql` | 31 | RPC input validation & authorization |
| **Total** | **190** | |

## Workflow Status

Check workflow runs:
- https://github.com/cs1060f25/MRKT-project/actions

## Troubleshooting

### Workflow fails with "SUPABASE_ACCESS_TOKEN not found"
- Verify secrets are added to repository settings
- Check secret names match exactly (case-sensitive)

### Deployment workflow doesn't trigger
- Ensure changes are in `supabase/migrations/` directory
- Check that push is to `main` branch
- Verify Actions are enabled in repository settings

### Tests fail in CI but pass locally
- Ensure Supabase CLI version matches (`latest`)
- Check for environment-specific differences
- Verify seed data is properly configured

## Security Notes

⚠️ **Never commit secrets to the repository**
- All secrets are stored in GitHub Secrets (encrypted)
- `.env` file is gitignored
- Secrets are only available during workflow execution
- Access is logged and auditable

## Manual Deployment

If automatic deployment fails, deploy manually:

```bash
# Link to production
supabase link --project-ref kgnpbrdrqsqpcyvzbhjx

# Push migrations
supabase db push
```
