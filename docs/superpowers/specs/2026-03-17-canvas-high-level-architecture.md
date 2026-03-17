# Canvas High-Level Architecture Revision

Date: 2026-03-17
Status: Approved refinement
Scope: Backend packaging simplification and high-level diagram alignment

## Decision

`canvas` uses a simplified backend packaging model:

- one Node.js/TypeScript backend project: `canvas-backend`
- one Docker image
- two runtime modes
  - `API mode`
  - `Worker mode`

This keeps day-one delivery simple while preserving clean module boundaries for future extraction.

## Why this is the recommended shape

- simpler local development
- simpler CI/CD and image management
- simpler Kubernetes deployment model
- no version skew between API and worker code
- still allows API and background jobs to scale independently

## Internal backend modules

- `auth/session`
- `tenant/rbac`
- `datasets`
- `ingestion`
- `query`
- `charts`
- `workbooks`
- `dashboards`
- `realtime`
- `shared` (`db`, `redis`, `s3`, `config`, `logging`)

## Deployment model

- `canvas-backend-api`
  - runs REST APIs and WebSocket gateway
- `canvas-backend-worker`
  - runs import, normalization, export, and async jobs
- both deployments use the same Docker image with different start commands

## Diagram layout

The high-level draw.io diagram is organized as four vertical swimlanes:

- `Host`
- `Embed SDK`
- `Canvas Platform / Backend`
- `Shared Storage`

This keeps the main traffic paths readable and avoids having connection lines run directly through module labels.

## Mermaid reference

```mermaid
flowchart LR
    subgraph Host["Host Application"]
        User["End User"]
        Frontend["Host Frontend<br/>Next.js"]
        Backend["Host Backend<br/>Session signer / Data push"]
        User --> Frontend
        Frontend --> Backend
    end

    SDK["canvas-embed-sdk<br/>Embedded UI package"]

    subgraph Canvas["Canvas Platform"]
        subgraph K8s["Kubernetes"]
            subgraph API["canvas-backend API mode"]
                Session["Session/Auth"]
                RBAC["Tenant/RBAC"]
                Datasets["Dataset API"]
                Query["Query/Chart API"]
                Dashboards["Workbook/Dashboard API"]
                Realtime["Realtime Gateway"]
            end

            subgraph Worker["canvas-backend Worker mode"]
                Import["Import Jobs"]
                Normalize["Normalize Jobs"]
                Async["Export/Async Jobs"]
            end

            PG["Postgres"]
            Redis["Redis"]
            S3["S3"]
        end
    end

    Frontend --> SDK
    Backend --> Session
    Backend --> Datasets
    SDK --> Session
    SDK --> Datasets
    SDK --> Query
    SDK --> Dashboards
    SDK <--> Realtime

    API --> PG
    API --> Redis
    API --> S3
    Worker --> Redis
    Worker --> PG
    Worker --> S3
```

## Implementation note

This revision replaces the earlier “many backend services” presentation at the high level. Internally the code should still keep strong boundaries so we can split services later if scale or team structure demands it.
