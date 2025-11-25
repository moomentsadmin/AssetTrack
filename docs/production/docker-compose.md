**Docker Compose — Self-hosted or single-node cloud VM**

This project already includes `docker-compose.yml` and `Dockerfile`. Use this guide to deploy using Docker Compose (recommended for simple deployments).

1) Prepare `.env.production`

Copy the example and set values:

```bash
cp docs/production/.env.production.example .env.production
# then edit .env.production and fill DATABASE_URL, SESSION_SECRET, SMTP_*, etc.
```

2) Build and start with Compose (production)

Use the provided compose file (adjust service names and volumes if needed):

```bash
# build images
docker compose build --pull

# start detached
docker compose up -d

# tail logs
docker compose logs -f
```

3) Migrations

There are two supported approaches for migrations:

- Manual (recommended): Run migrations from CI or a maintenance host using the built image or `npx drizzle-kit` locally. Examples:

```bash
export DATABASE_URL="postgres://..."
npx drizzle-kit push:pg --env DATABASE_URL

# Or using the built image
docker compose run --rm app npx drizzle-kit push:pg --env DATABASE_URL
```

- Automatic (optional): The container entrypoint can run migrations at startup when the `ENABLE_AUTO_MIGRATIONS` environment variable is set to `true`. This is disabled by default and not recommended for multi-replica/rolling deployments.

Set `ENABLE_AUTO_MIGRATIONS=true` in your `.env.production` to enable entrypoint migrations. Prefer manual migrations for production to keep control over schema changes.

4) Healthchecks & scaling

- The `docker-compose.yml` can be configured to restart on failure and set healthchecks for `db` and `app`.
- For high availability, use orchestrators like Docker Swarm, Kubernetes, or ECS.

5) Secrets and registry

- Use GitHub Actions (added) to build and push Docker Hub images. Add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets.
- Keep `.env.production` out of git. Prefer a secret manager or environment variables in your host/CI.

Device tracking removal
- The previous optional device tracking feature (and `tracking-agent` installers) has been removed.
- The environment flag `ENABLE_DEVICE_TRACKING` is deprecated and no longer present in `.env.production.example`.
- Existing production databases should manually drop legacy device tracking tables once data retention requirements are satisfied.
