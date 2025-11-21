**DigitalOcean — Managed Database & App Platform**

DigitalOcean provides a Managed Database for PostgreSQL and App Platform / Droplets to host containers or VMs.

1) Managed Database

- Create a new Managed Database for PostgreSQL in DigitalOcean.
- Note the connection string and set trusted sources (App Platform or your Droplet IPs).

2) Connection string

DigitalOcean provides a connection string like:

```text
postgres://doadmin:<password>@db-postgresql-nyc3-xxxx-do-user-xxxx-0.db.ondigitalocean.com:25060/assettrack?sslmode=require
```

3) App Platform (recommended for simple deploy)

- Create an app and connect your GitHub repo.
- Add environment variables (DATABASE_URL, SESSION_SECRET, SMTP settings) in App Platform settings.
- Configure a web service that builds the Dockerfile and sets the port to `5000`.

4) Droplet + Docker Compose

- Create a Droplet, install Docker and Docker Compose, then follow the Docker Compose guide in this folder.

5) Migrations

Run migrations from a CI runner or from the droplet itself with access to `DATABASE_URL`:

```bash
npx drizzle-kit push:pg --env DATABASE_URL
```

Security notes
- Keep allowed inbound IP ranges narrow. Use private networking when possible.
- Use DigitalOcean Managed DB trusted sources to allow the App Platform or droplet to connect.
