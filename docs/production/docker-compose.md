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

Device tracking note
- The project includes a small device tracking feature and companion `tracking-agent` installers. This is optional and disabled by default.
- To enable server-side tracking, set `ENABLE_DEVICE_TRACKING=true` in your `.env.production`. When disabled the `/tracking-agent/*` static routes and all `/api/device-tracking` endpoints will not be registered.
-- For stricter production images you may remove the `tracking-agent` folder from the build process; the production `Dockerfile` in this branch does not include the `tracking-agent` assets by default. Keep the feature disabled by default unless you have a clear use case and policies for data retention and access control.
