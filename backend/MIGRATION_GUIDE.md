# Database Migration Guide

## Running Migrations

### Prerequisites

1. **PostgreSQL is running:**
   ```bash
   docker compose up -d
   ```

2. **Environment variables are configured:**
   - Create `backend/.env` file (see `ENV_VARIABLES.md`)
   - Ensure database connection details are correct

### Run Migration

To remove Keycloak columns from the database:

```bash
cd backend
npm run migration:run
```

This will:
- Remove `keycloak_id` column from `users` table
- Remove `keycloak_role_id` column from `roles` table

### Revert Migration (if needed)

If you need to rollback the migration:

```bash
cd backend
npm run migration:revert
```

### Check Migration Status

You can check which migrations have been run by querying the database:

```bash
docker exec -it iam-postgres-api psql -U iam -d iam -c "SELECT * FROM migrations;"
```

## Migration Files

- `src/database/migrations/1734567890000-RemoveKeycloakColumns.ts`
  - Removes Keycloak-related columns from users and roles tables

## Troubleshooting

### Migration Fails: "Column does not exist"
- This is normal if the columns were already removed
- The migration checks for column existence before dropping
- Migration will complete successfully even if columns don't exist

### Migration Fails: Connection Error
- Verify PostgreSQL is running: `docker compose ps`
- Check database credentials in `.env` file
- Test connection: `docker exec -it iam-postgres-api psql -U iam -d iam -c "SELECT 1;"`

### Migration Fails: Permission Error
- Ensure database user has ALTER TABLE permissions
- Check that user `iam` has proper access to the database

## Development Mode

In development mode (`NODE_ENV=development`), TypeORM's `synchronize` option is enabled, which automatically syncs entity changes to the database. However, it's still recommended to use migrations for:
- Production deployments
- Tracking schema changes
- Team collaboration

## Production Considerations

For production:
1. **Disable synchronize:**
   ```env
   NODE_ENV=production
   ```
   (synchronize is automatically disabled when NODE_ENV is not 'development')

2. **Always use migrations** to manage schema changes

3. **Test migrations** on a staging environment first

4. **Backup database** before running migrations in production

