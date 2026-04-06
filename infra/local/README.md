# Local Services

This directory contains the local services used for Canvas development:

- PostgreSQL for Prisma data
- Redis for cache/session
- MinIO for S3-compatible object storage

## Start

```bash
pnpm db:up
```

## Stop

```bash
pnpm db:down
```

## Default connection string

```bash
DATABASE_URL=postgres://canvas:canvas@localhost:5432/canvas
```

## Default object storage settings

```bash
S3_ENDPOINT=http://127.0.0.1:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=canvas-raw
S3_FORCE_PATH_STYLE=true
```

MinIO console:

```bash
http://127.0.0.1:9001
```

Credentials:

```bash
minioadmin / minioadmin
```

## Notes

- PostgreSQL data is stored in the `canvas-postgres-data` Docker volume.
- Object storage data is stored in the `canvas-minio-data` Docker volume.
- `pnpm db:up` will also ensure the `canvas-raw` bucket exists in MinIO.
- Once services are running, you can run Prisma commands from `packages/db` and dataset uploads from the Portal.
