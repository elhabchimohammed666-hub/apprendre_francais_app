# LinguaFranca

Une application MERN pour apprendre le français : leçons A1/A2, quiz interactifs et suivi de progression.

## Prérequis

- Node.js 20 ou plus récent
- npm
- MongoDB pour activer l’API et les comptes utilisateurs (facultatif pour explorer l’interface)

## Démarrage

```powershell
npm install
npm install --prefix client
npm install --prefix server
Copy-Item .env.example server\.env
npm run dev
```

Le site est servi sur <http://localhost:5173> et l’API sur <http://localhost:5000>. Sans MongoDB, l’interface reste navigable avec les leçons intégrées et enregistre la progression dans le navigateur.

Pour activer les comptes et la progression serveur, démarrez MongoDB puis configurez `server/.env`. Remplacez impérativement `JWT_SECRET` par une valeur aléatoire longue avant tout déploiement.

Pour charger les six leçons de démonstration dans MongoDB, exécutez une fois :

```powershell
npm run seed --prefix server
```

Ensuite, `npm run dev` lance le frontend et l’API ensemble.

## Contenu

- `client/` : React, Vite et styles CSS responsives.
- `server/` : Express, Mongoose, JWT en cookie HTTP-only et routes REST.

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/lessons?level=A1&category=vocabulary`
- `GET /api/lessons/:id`
- `POST /api/quizzes/:id/submit` avec `{ "answers": [0, 1] }`
- `GET /api/progress/me`

Les réponses correctes ne sont pas incluses dans les données de quiz publiques ; le serveur calcule le score lors de la soumission.
