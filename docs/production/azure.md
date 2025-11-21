**Azure — Azure Database for PostgreSQL + Containers**

1) Provision Azure Database for PostgreSQL

- Use Azure Portal to create "Azure Database for PostgreSQL" (Flexible Server recommended).
- Configure VNet if deploying app into the same VNet, otherwise set firewall rules to allow app IPs.

2) Connection string

Example connection string:

```text
postgres://<username>:<password>@yourserver.postgres.database.azure.com:5432/assettrack?sslmode=require
```

3) Hosting options

- Azure Container Instances (ACI) or Azure App Service for Containers: provide `DATABASE_URL` as an environment variable in the app settings.
- Azure Kubernetes Service (AKS) for more advanced deployments.

4) Run migrations

From CI or an admin host with `DATABASE_URL` available:

```bash
npx drizzle-kit push:pg --env DATABASE_URL
```

Notes
- Azure may require SSL and specific TLS settings; use `?sslmode=require` in the URL.
- Use Azure Key Vault to store DB credentials and inject them into your deployment for better security.
