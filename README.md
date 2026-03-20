# Nantes App

Application de navigation urbaine pour Nantes.
Le projet s'appuie sur des microservices (OpenData, gestion de donnees, service principal).

## Structure actuelle

```
.
├── README.md
└── microservices/
    ├── fetcher-opendata/   # API Express (toilettes, parkings, composteurs)
    ├── data-manager/       # A completer (stocker les données recup par les fetchers)
    └── main/               # A completer (permet de répondre a une requette client avec les données recupérés)
```

## Lancer le microservice OpenData

1. Se placer dans le dossier du service :
   ```bash
   cd microservices/fetcher-opendata
   ```
2. Installer les dependances :
   ```bash
   npm install
   ```
3. Demarrer en mode developpement :
   ```bash
   npm run dev
   ```

Le service demarre sur `http://localhost:3001` avec des routes sous `/api`.

