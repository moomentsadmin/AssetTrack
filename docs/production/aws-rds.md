**AWS RDS (PostgreSQL) — Managed database**

This guide covers provisioning a Postgres DB in RDS and connecting AssetTrack.

1) Create an RDS instance

- In AWS Console → RDS → Create database → PostgreSQL.
- Choose instance class, storage, VPC, and security group.
- Set "Publicly accessible" according to your architecture; prefer private with app in same VPC.

2) Security groups & networking

- If app runs in the same VPC (EC2, ECS), allow the app subnet's security group to connect to the RDS SG on port 5432.
- If your app runs outside AWS, open RDS to your app IP (less secure). Use SSL by enabling `require` in the connection string.

3) Build `DATABASE_URL`

Format:

```text
postgres://<username>:<password>@<rds-endpoint>:5432/<dbname>?sslmode=require
```

Example `.env.production` entry:

```text
DATABASE_URL=postgres://asset_user:SuperSecretPassword@assettrack-db.xxxxxx.us-east-1.rds.amazonaws.com:5432/assettrack?sslmode=require
```

4) Using ECS / EC2

- For EC2: deploy using Docker Compose or systemd on EC2 instances. Ensure EC2 security group allows outbound to RDS.
- For ECS/Fargate: provide `DATABASE_URL` through ECS Secrets (SSM Parameter Store or Secrets Manager) and mount as environment variable.

5) Backups & maintenance

- Enable automated backups and set a backup retention policy.
- Use RDS snapshots for point-in-time recovery and retention policy.

6) Run migrations

From your CI or a maintenance host where `DATABASE_URL` is available:

```bash
npx drizzle-kit push:pg --env DATABASE_URL
```

Notes
- If using `sslmode=require` you may need to supply `?sslmode=require` in the URL. The `pg` driver will accept that.
- For strict TLS verification, configure `ssl` with `rejectUnauthorized: false` only if you understand the implications. Prefer correct CA verification.
