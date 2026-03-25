# microservices/main

Microservice **main / brain** de la SAE S4.

## Rôle du service

Le service `main` joue le rôle d’agrégateur métier entre les autres microservices.

Il :
- reçoit une requête utilisateur contenant un point de départ, un point d’arrivée et une liste de types de POI ;
- interroge le `data-manager` pour récupérer les données déjà stockées ;
- normalise les objets récupérés dans un format commun ;
- sélectionne les POI les plus pertinents ;
- renvoie un JSON d’itinéraire simplifié.

Ce service ne va pas directement chercher les données OpenData sur Internet : ce rôle est assuré par `fetcher-opendata`.

---

## Place du microservice dans l’architecture

Architecture simplifiée :

```text
Utilisateur / client HTTP
        |
        v
      main (brain)
        |
        v
   data-manager
        ^
        |
fetcher-opendata
        |
        v
OpenData Nantes Métropole
```

### Répartition des rôles

- `fetcher-opendata` : récupère les données OpenData Nantes
- `data-manager` : stocke et expose les données via une API REST
- `main` : agrège, filtre, normalise et construit une réponse métier

---

## Fonctionnement général

### 1. Chargement des données
Le microservice `fetcher-opendata` appelle les datasets OpenData Nantes et envoie les résultats au `data-manager`.

### 2. Lecture des données
Le microservice `main` interroge le `data-manager` avec :

- `GET /api/db/poi`
- `GET /api/db/poi?type=...`

### 3. Normalisation
Les objets OpenData n’ayant pas tous la même structure, `main` essaie de transformer chaque enregistrement dans un format commun :

```json
{
  "type": "toilettes",
  "name": "Daviais",
  "lat": 47.2119,
  "lon": -1.5586,
  "address": "Nantes"
}
```

### 4. Sélection
Le service calcule un score simple à partir :
- de la distance depuis le point de départ ;
- de la distance vers le point d’arrivée.

Les POI les mieux placés sont gardés selon `maxPoi`.

### 5. Construction du trajet
Le trajet renvoyé est pour l’instant un **trajet simplifié** :
- départ → POI 1 → POI 2 → arrivée

Aucune API externe de routing n’est encore branchée à ce stade.

---

## Structure du microservice

```text
main/
├── app.js
├── service.js
├── controllers/
├── dao/
├── docs/
├── routes/
├── services/
├── tests/
├── utils/
└── validators/
```

### Rôle des dossiers

- `routes/` : définition des routes HTTP
- `controllers/` : gestion des requêtes et réponses
- `services/` : logique métier principale
- `dao/` : communication avec les autres microservices
- `utils/` : fonctions utilitaires (distance, normalisation, etc.)
- `validators/` : validation des entrées
- `docs/` : Swagger
- `tests/` : tests du service

---

## Routes disponibles

### `GET /`
Retourne un message simple indiquant que le service fonctionne.

### `GET /api/health`
Retourne l’état du service.

Exemple de réponse :

```json
{
  "service": "main-brain",
  "status": "ok"
}
```

### `GET /api/poi/available-types`
Retourne les types de POI actuellement gérés par le service.

### `POST /api/itinerary/plan`
Construit un trajet simplifié à partir :
- du point de départ ;
- du point d’arrivée ;
- des types de POI ;
- du nombre maximum de POI à retenir.

### `POST /api/itinerary/debug`
Retourne les étapes intermédiaires utiles pour le débogage :
- nombre d’objets récupérés par type ;
- aperçu des objets normalisés ;
- total normalisé.

### `GET /api/docs`
Expose la documentation Swagger.

---

## Exemple de requête

### Body pour `POST /api/itinerary/plan`

```json
{
  "start": { "lat": 47.2184, "lon": -1.5536 },
  "end": { "lat": 47.205, "lon": -1.562 },
  "poiTypes": ["toilettes", "composteurs"],
  "maxPoi": 2
}
```

---

## Exemple de réponse

```json
{
  "request": {
    "start": { "lat": 47.2184, "lon": -1.5536 },
    "end": { "lat": 47.205, "lon": -1.562 },
    "poiTypes": ["toilettes", "composteurs"],
    "maxPoi": 2
  },
  "summary": {
    "availablePoiCount": 20,
    "selectedPoiCount": 2,
    "routingProvider": "internal"
  },
  "selectedPoi": [
    {
      "type": "toilettes",
      "name": "Daviais",
      "lat": 47.211908078704504,
      "lon": -1.5586621685672566,
      "address": "Nantes"
    }
  ],
  "route": {
    "provider": "internal",
    "mode": "mvp-direct",
    "segments": [
      {
        "from": { "lat": 47.2184, "lon": -1.5536 },
        "to": { "lat": 47.211908078704504, "lon": -1.5586621685672566 }
      }
    ],
    "note": "Trajet simplifié : aucune API externe de routing utilisée pour le moment."
  }
}
```

---

## Installation

Depuis la racine du projet :

```bash
cd microservices/main
cp .env.example .env
npm install
npm run dev
```

---

## Variables d’environnement

Exemple minimal :

```env
PORT=3003
DATA_MANAGER_URL=http://localhost:3002
MAX_DEFAULT_POI=3
ROUTING_PROVIDER=internal
```

---

## Dépendances de fonctionnement

Le microservice `main` dépend du `data-manager`.

Avant de tester `main`, il faut donc avoir :
1. `data-manager` lancé sur `http://localhost:3002`
2. `fetcher-opendata` lancé sur `http://localhost:3001`
3. des données déjà chargées dans `data-manager`

---

## Ordre de lancement conseillé

### 1. Lancer `data-manager`

```bash
cd microservices/data-manager
npm install
npm run dev
```

### 2. Lancer `fetcher-opendata`

```bash
cd microservices/fetcher-opendata
npm install
npm run dev
```

### 3. Charger les données

```bash
curl http://localhost:3001/api/toilettes
curl http://localhost:3001/api/composteurs
curl http://localhost:3001/api/parkings
```

### 4. Lancer `main`

```bash
cd microservices/main
npm install
npm run dev
```

---

## Tests utiles

### Test du service seul

```bash
curl http://localhost:3003/api/health
```

### Test debug

```bash
curl -X POST http://localhost:3003/api/itinerary/debug \
  -H "Content-Type: application/json" \
  -d '{
    "start": { "lat": 47.2184, "lon": -1.5536 },
    "end": { "lat": 47.205, "lon": -1.562 },
    "poiTypes": ["toilettes", "composteurs"],
    "maxPoi": 2
  }'
```

### Test plan

```bash
curl -X POST http://localhost:3003/api/itinerary/plan \
  -H "Content-Type: application/json" \
  -d '{
    "start": { "lat": 47.2184, "lon": -1.5536 },
    "end": { "lat": 47.205, "lon": -1.562 },
    "poiTypes": ["toilettes", "composteurs"],
    "maxPoi": 2
  }'
```

### Tests automatisés

```bash
npm test
```

Attention : cette commande doit être lancée depuis `microservices/main`.

---

## État actuel du développement

### Ce qui fonctionne
- démarrage du microservice
- documentation Swagger
- communication avec `data-manager`
- validation des requêtes
- calcul d’un trajet simplifié
- normalisation validée sur le dataset `toilettes`

### Limites actuelles
- pas encore de vrai moteur de routing externe
- sélection basée sur une logique simple de distance
- normalisation encore à compléter pour certains datasets comme `composteurs`

---

## Modifications apportées au reste du projet pour le proxy

Pour permettre au projet de fonctionner aussi bien :
- sur les machines de l’IUT avec proxy ;
- que sur une machine personnelle sans proxy ;

des modifications légères ont été faites côté `fetcher-opendata`.

### 1. Proxy rendu optionnel pour l’accès OpenData
Le fetcher lit automatiquement les variables d’environnement suivantes si elles existent :

- `https_proxy`
- `HTTPS_PROXY`
- `http_proxy`
- `HTTP_PROXY`

Si aucune n’est définie, la connexion se fait directement.

Cela permet :
- de fonctionner à l’IUT avec proxy ;
- de fonctionner à la maison sans rien changer au code.

### 2. Appels locaux sans proxy
Les appels entre microservices vers `localhost` ne passent jamais par un proxy.

Concrètement :
- `fetcher-opendata -> data-manager`
- `main -> data-manager`

utilisent `proxy: false` côté Axios.

Cela évite qu’un proxy institutionnel interfère avec les communications locales.

### 3. Pas de proxy codé en dur
L’adresse du proxy n’est pas écrite en dur dans le dépôt.

Le comportement dépend uniquement de l’environnement d’exécution de la machine.

### 4. Intérêt de cette approche
Cette solution rend le projet plus portable :
- Linux à l’IUT
- Windows personnel
- autre machine sans modification du code métier

---

## Prochaines étapes conseillées

1. compléter la normalisation pour tous les datasets utiles ;
2. réduire la quantité de `raw` retournée dans les réponses finales si besoin ;
3. ajouter des tests plus complets sur les DAO et la logique métier ;
4. brancher un vrai service de routing ;
5. documenter un scénario de démonstration pour l’oral.
