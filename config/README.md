# Deployment manifests

Kustomize layout, mirroring the `milo-os` service convention (`base` +
`components` + `overlays`).

```
config/
  base/                     # namespace, serviceaccount, service, deployment
  components/               # opt-in cross-cutting concerns (kind: Component)
    database-cnpg/          # CloudNativePG Cluster + POSTGRES_* env wiring
    app-config/             # mounts a `backstage-app-config` ConfigMap as --config
    networking/             # HTTPRoute onto the shared internal-auth-gateway
  overlays/
    e2e/                    # base + database-cnpg + app-config, image backstage:e2e
```

## base

Environment-agnostic primitives. The container image is pinned here
(`images:`) by the publish pipeline before the bundle is pushed to
`oci://ghcr.io/datum-cloud/backstage-kustomize`.

## components

Each component factors out one concern so any overlay can opt in via
`components:`.

| Component | Provides |
|---|---|
| `database-cnpg` | A `postgresql.cnpg.io` `Cluster` (`backstage-postgres`) and a Deployment patch sourcing `POSTGRES_*` from the generated `backstage-postgres-app` secret. Used by the kind e2e environment. |
| `app-config` | Deployment patch that layers `app-config.yaml` with a `backstage-app-config` ConfigMap mounted at `/etc/backstage`. The overlay supplies the ConfigMap contents. |
| `networking` | An `HTTPRoute` attaching to the shared `internal-auth-gateway` (OIDC is enforced at the gateway). |

## overlays

`e2e` composes `base` with `database-cnpg` and `app-config` and is what the
`E2E` workflow deploys into a kind cluster. Production overlays are composed
on the deploy side (infra repo) from `base` plus the relevant components.

Secret injection (the GitHub App credentials, backend secret, etc.) is
environment-specific — the secret store, GCP project, and secret names differ
per stack — so it is defined in the infra overlay as an `ExternalSecret` plus
an `envFrom` Deployment patch, not shipped as a component here.
