# Matheopolis

Projet universitaire (BUT informatique) split en deux serveurs:

- `backend/`: API metier en PHP natif + MySQL.
- `frontend/`: pages et mini-jeux en TypeScript vanilla.

## Arborescence

- `backend/` : logique metier, routes API, base de donnees, tests PHP.
- `frontend/` : interface client, contenus (`content/`), mocks (`mocks/`).
- `infra/` : orchestration locale Docker.
- `scripts/` : scripts dev/deploiement (`.sh`).
- `docs/` : documentation API, architecture, test et deployment.

## Demarrage local rapide

Prerequis: Docker Desktop.

- Bash: `./scripts/dev-up.sh`

URLs:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- MySQL: `localhost:3307`

## Commandes qualite

Backend (`backend/`):
- `composer install`
- `composer quality`

Frontend (`frontend/`):
- `npm install`
- `npm run check`

## API et docs

- API humaine: `docs/api.md`
- Spec OpenAPI: `docs/openapi.yaml`
- Architecture: `docs/architecture.md`
- Test/mocks: `docs/testing.md`
- Deployment: `docs/deployment.md`
