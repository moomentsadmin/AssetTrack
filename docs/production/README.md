**Production Deployment**

This folder contains provider-specific step-by-step deployment instructions for running AssetTrack in production. Pick the guide that matches your target environment.

- **Ubuntu**: Systemd + Node.js build deployment (self-hosted VM)
- **Docker Compose**: Run the official Docker image or build locally with `docker-compose`
- **AWS RDS**: Use Amazon RDS for PostgreSQL with example connection and security notes
- **DigitalOcean**: Managed DB and App Platform guidance
- **Azure**: Azure Database for PostgreSQL and container hosting notes

Before you deploy:
- Create a secure `DATABASE_URL` for your Postgres instance.
- Provision secrets (SMTP, session secret, Docker/registry credentials).
- Ensure migrations are applied (see migration commands in each guide).

Device tracking feature:
- **Flag**: `ENABLE_DEVICE_TRACKING` (see `.env.production.example`).
- **Default**: `false` — device tracking is disabled by default to avoid
	accidental exposure or additional runtime/DB load.
- **When to enable**: set to `true` only if you intend to run the companion
	device agent and accept the privacy, networking, and storage implications.
- **Recommendation**: keep device tracking off for most production deployments
	unless your team has reviewed the architecture and retention policy.

Note: the production `Dockerfile` in this branch does not include `tracking-agent`
assets by default. If you need installers available from the image, add them to
your private image build process and set `ENABLE_DEVICE_TRACKING=true` only for
environments that require it.

If you have questions about a specific provider, open an issue or ask for clarification.
