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

3) Run migrations using the container image

Option A: run `drizzle-kit` from the host (requires node/drizzle-kit installed):

```bash
export DATABASE_URL="postgres://..."
npx drizzle-kit push:pg --env DATABASE_URL
```

Option B: run migrations from the running image (safer when using the built image):

```bash
docker compose run --rm app npx drizzle-kit push:pg --env DATABASE_URL
```

4) Healthchecks & scaling

- The `docker-compose.yml` can be configured to restart on failure and set healthchecks for `db` and `app`.
- For high availability, use orchestrators like Docker Swarm, Kubernetes, or ECS.

5) Secrets and registry

- Use GitHub Actions (added) to build and push Docker Hub images. Add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets.
- Keep `.env.production` out of git. Prefer a secret manager or environment variables in your host/CI.
