# Datum Backstage

This repository contains Datum's [Backstage](https://backstage.io) developer
portal and software catalog. The backend image is built and published to
`ghcr.io/datum-cloud/backstage`.

It was generated with the official `@backstage/create-app` scaffolder and is a
standard Backstage monorepo (`packages/app` for the frontend, `packages/backend`
for the backend).

## Running locally

```sh
yarn install
yarn dev
```

This serves the frontend and backend together for local development.

## Building the image

The backend image is built using the host-build flow (see
`packages/backend/Dockerfile`). CI in `.github/workflows/build-image.yaml` builds
and pushes the image to `ghcr.io/datum-cloud/backstage` on pushes to `main` and
on tags.

## Related repositories

The catalog org-model (Users, Groups, Systems, Components, etc.) and the
Kubernetes deploy manifests for this application live in the
[`datum-cloud/infra`](https://github.com/datum-cloud/infra) repository, not here.

See the design proposal for context and architecture:
<https://github.com/datum-cloud/infra/blob/main/docs/enhancements/backstage-service-catalog/README.md>
