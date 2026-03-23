# Nantes App

Application de navigation urbaine pour Nantes basee sur une architecture microservices.

## Etat actuel du projet

Deux microservices sont implementes et communiquent entre eux:

- `fetcher-opendata` : recupere les donnees OpenData de Nantes
- `data-manager` : stocke les donnees en base MongoDB en memoire

Le dossier `microservices/main` est present mais vide pour le moment.

## Architecture

Flux actuel:

1. Le client appelle le service `fetcher-opendata`.
2. Le fetcher va chercher les jeux de donnees sur l'API OpenData de Nantes.
3. Le fetcher envoie ensuite les donnees au `data-manager` via HTTP.
4. Le `data-manager` remplace les anciennes donnees du type concerne en base memoire.

## Structure

```
.
├── README.md
└── microservices/
      ├── fetcher-opendata/
      │   ├── service.js
      │   ├── controllers/
      │   ├── dao/
      │   └── routes/
      ├── data-manager/
      │   ├── serveur.mjs
      │   ├── app.mjs
      │   └── api/
      │       ├── controlleur/
      │       ├── dao/
      │       ├── model/
      │       └── route/
      └── main/ (vide)
```

## Prerequis

- Node.js 18+
- npm

Note Windows PowerShell: si une politique d'execution bloque npm, utiliser `npm.cmd` a la place de `npm`.

## Configuration

### 1) data-manager

Dans `microservices/data-manager`, creer un fichier `.env` a partir de `.env.example`:

```
PORT=3002
```

### 2) fetcher-opendata

Dans `microservices/fetcher-opendata`, creer un fichier `.env` a partir de `.env.example`:

```
PORT=3001
DATA_MANAGER_URL=http://localhost:3002
```

## Lancement des services

Lancer d'abord le Data Manager, puis le Fetcher.

### Terminal 1 - Data Manager

```bash
cd microservices/data-manager
npm install
npm run dev
```

Service disponible sur `http://localhost:3002`.

### Terminal 2 - Fetcher OpenData

```bash
cd microservices/fetcher-opendata
npm install
npm run dev
```

Service disponible sur `http://localhost:3001`.

## Exemple d'utilisation de data manager 

Démarrer Data Manager (3002).
Démarrer Fetcher (3001).
Appeler http://localhost:3001/api/toilettes.
Puis appeler http://localhost:3002/api/db/poi?type=toilettes. 

## API disponible

### fetcher-opendata (`/api`)

- `GET /api/toilettes`
- `GET /api/parkings`
- `GET /api/composteurs`

Chaque route:

1. recupere les donnees depuis l'OpenData Nantes,
2. envoie ces donnees au Data Manager sur `POST /api/db/poi`,
3. retourne un message de succes avec le nombre d'elements traites.

### data-manager (`/api/db`)

- `POST /api/db/poi`
   - body attendu:

      ```json
      {
         "type": "toilettes",
         "data": [{ "...": "..." }]
      }
      ```

- `GET /api/db/poi`
   - retourne toutes les donnees stockees

- `GET /api/db/poi?type=toilettes`
   - retourne seulement les donnees d'un type

## Jeux de donnees OpenData integres

- Toilettes publiques
- Parkings publics (disponibilites)
- Composteurs de quartier

## Limites actuelles

- Base de donnees en memoire: les donnees sont perdues a chaque redemarrage du `data-manager`.
- Pas encore de service principal/aggregateur dans `microservices/main`.
- Pas de suite de tests automatisee declaree dans les scripts npm.

