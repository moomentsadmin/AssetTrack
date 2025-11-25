**Production Deployment**

This folder contains provider-specific step-by-step deployment instructions for running AssetTrack in production. Pick the guide that matches your target environment.

- **Docker Compose**: Run the official Docker image or build locally with `docker-compose`
- **Docker with SSL/HTTPS**: Automated SSL certificates with Traefik and Let's Encrypt
- **Ubuntu**: Systemd + Node.js build deployment (self-hosted VM)
- **AWS RDS**: Use Amazon RDS for PostgreSQL with example connection and security notes
- **DigitalOcean**: Managed DB and App Platform guidance
- **Azure**: Azure Database for PostgreSQL and container hosting notes

Before you deploy:
- Create a secure `DATABASE_URL` for your Postgres instance.
- Provision secrets (SMTP, session secret, Docker/registry credentials).
- Ensure migrations are applied (see migration commands in each guide).

Device tracking removal:
- The prior optional device tracking subsystem and `tracking-agent` assets have been fully removed from the application and Docker image.
- The `ENABLE_DEVICE_TRACKING` flag is deprecated and no longer used.
- If your database still contains legacy device tracking tables, plan a controlled drop after confirming retention / compliance requirements.

If you have questions about a specific provider, open an issue or ask for clarification.
