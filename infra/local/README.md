# Local Database

This directory contains the local PostgreSQL runtime used for Prisma development and integration tests.

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

## Notes

- The database data is stored in the `canvas-postgres-data` Docker volume.
- Once the database is running, you can run Prisma commands from `packages/db`.
