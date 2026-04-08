# Nantes App — Architecture microservices OpenData

## 1. Présentation du projet

Ce projet a pour objectif de faire communiquer plusieurs **microservices REST** dans le cadre de la SAE, sans partie Android, autour d'un cas concret de **navigation urbaine à Nantes** fondée sur des jeux de données OpenData.

L'application vise à exploiter des données utiles à l'échelle de la ville de Nantes, par exemple :

- toilettes publiques ;
- parkings publics ;
- composteurs de quartier ;
- et, à terme, d'autres données comme les jours de collecte, les limitations de vitesse, les bacs de tri, les vélos en libre-service, etc.

La version actuelle validée techniquement repose sur trois jeux de données :

- **toilettes publiques** ;
- **parkings publics** ;
- **composteurs de quartier**.

Le scénario métier principal est le suivant :

- l'utilisateur fournit un **point de départ** et un **point d'arrivée** ;
- il choisit un ou plusieurs types de **points d'intérêt (POI)** ;
- l'application récupère les POI disponibles ;
- elle sélectionne les plus pertinents ;
- elle renvoie un **trajet JSON** reliant départ, POI retenus et arrivée.








## 2. Architecture globale du système

### Arborescence générale du projet

```text
.
├── microservices/
│   ├── fetcher-opendata/
│   ├── data-manager/
│   └── main/
└── README.md
```


L'application est organisée en trois couches principales :

1. **Collecte** — `fetcher-opendata`
2. **Persistance / cache** — `data-manager`
3. **Intelligence métier / agrégation** — `main` (brain)

Le flux métier principal visé est :

```text
Client → brain → data-manager → fetcher-opendata → OpenData Nantes
```

Cette architecture répond à une règle importante du projet :

- le **fetcher** connaît la source et transforme ;
- le **data-manager** stocke et décide s'il faut rafraîchir ;
- le **brain** applique la logique métier.

Autrement dit :

- **normalisation source** → fetcher
- **stockage/cache** → data-manager
- **agrégation métier** → brain




## 3. Démarrage du projet

1. Se mettre à la racine du projet 
2. Lancer le script `run.sh` : `./run.sh`


## 4. Exemples de tests

### 4.1 Types disponibles

```bash
curl -s http://localhost:3003/api/poi/available-types
```

### 4.2 Itinéraire avec toilettes

```bash
curl -s -X POST http://localhost:3003/api/itinerary/plan \
  -H "Content-Type: application/json" \
  -d '{
    "start": { "lat": 47.2184, "lon": -1.5536 },
    "end": { "lat": 47.2065, "lon": -1.5632 },
    "poiTypes": ["toilettes"],
    "maxPoi": 2,
    "result":"complete"
  }'
```

### 4.3. Itinéraire avec parkings

```bash
curl -s -X POST http://localhost:3003/api/itinerary/plan \
  -H "Content-Type: application/json" \
  -d '{
    "start": { "lat": 47.2184, "lon": -1.5536 },
    "end": { "lat": 47.2065, "lon": -1.5632 },
    "poiTypes": ["parkings"],
    "maxPoi": 2,
    "result":"complete"
  }'
```

### 4.4 Itinéraire avec composteurs

```bash
curl -s -X POST http://localhost:3003/api/itinerary/plan \
  -H "Content-Type: application/json" \
  -d '{
    "start": { "lat": 47.2184, "lon": -1.5536 },
    "end": { "lat": 47.2065, "lon": -1.5632 },
    "poiTypes": ["composteurs"],
    "maxPoi": 2,
    "result":"complete"
  }'
```

### 4.5 Options de formatage du résultat (`result`)

Vous pouvez ajouter le paramètre optionnel `result` dans le corps de votre requête JSON pour modifier le format de la réponse renvoyée par l'API.

| Valeur | Description |
| :--- | :--- |
| `"complete"` | **(Par défaut)** Renvoie l'itinéraire détaillé avec la trace de débogage (`stateTrace`), les métadonnées et tous les segments. |
| `"compact"` | Renvoie une version optimisée pour le front-end : une liste simple de POI et un tableau de coordonnées continues (sans répétition). |
| `"geojson"` | Renvoie la réponse au format **standard GeoJSON**. Idéal pour visualiser directement le trajet et les marqueurs sur une carte comme [geojson.io](https://geojson.io). |

## 5. Format global des POI :

Pour que les trois microservices puissent coopérer proprement, tous les datasets sont convertis dans un **format commun** avant stockage.

Format minimal retenu :

```json
{
  "type": "toilettes",
  "sourceDataset": "toilettes",
  "sourceId": "abc123",
  "name": "Toilettes Place Royale",
  "lat": 47.213,
  "lon": -1.556,
  "address": "Place Royale",
  "city": "Nantes",
  "postcode": "44000",
  "accessibility": "PMR",
  "openingHours": "24h/24",
  "extra": {}
}
```

### Champs obligatoires

- `type`
- `sourceDataset`
- `sourceId`
- `name`
- `lat`
- `lon`

### Champs facultatifs

- `address`
- `city`
- `postcode`
- `accessibility`
- `openingHours`
- `extra`



## 6. Jeux de données gérés

### Toilettes publiques

Dataset exploité et validé de bout en bout.

### Parkings publics

Le traitement des parkings repose sur deux sources :

- un dataset de **disponibilités temps réel** ;
- un dataset **statique** contenant géolocalisation et informations descriptives.

La normalisation des parkings nécessite donc une **fusion** entre les deux sources.

État actuel :

- le flux fonctionne ;
- la majorité des parkings est normalisée ;
- quelques parkings peuvent encore ne pas être fusionnés automatiquement si les noms diffèrent trop entre le dataset temps réel et le dataset statique.

### Composteurs de quartier

Dataset exploité et validé de bout en bout.






## 7. Ports par défaut

- `fetcher-opendata` : `3001`
- `data-manager` : `3002`
- `main` : `3003`


## 8. Routes principales

### 8.1 Brain (`main`)

Routes publiques principales :

- `GET /api/health`
- `GET /api/poi/available-types`
- `POST /api/itinerary/debug`
- `POST /api/itinerary/plan`
- `GET /api/docs`

### 8.2 Data-manager

Routes publiques du pivot :

- `GET /api/db/poi?type=...`
- `GET /api/db/cache/:type`

Le `data-manager` est le point d'accès aux POI pour le `brain`.
Il décide lui-même s'il doit servir le cache ou déclencher un rafraîchissement interne.

### 8.3 Fetcher-opendata

Route technique interne :

- `GET /internal/fetch/:datasetKey`

Cette route n'est pas une route métier publique.
Le flux normal reste :

`Client → brain → data-manager → fetcher-opendata → OpenData Nantes`



# 9. Lancer les tests : 
Tout d'abord mettre à jour la version de node sur les pc de l'IUT : 
`nvm install --lts` 

Tests pour fetcher open data :

- Depuis la racine du projet : `cd microservices/fetcher-opendata`
- Lancer tous les tests : `npm test`
- Lancer les tests avec couverture : `npm run test:coverage`

Tests pour main : 

- Depuis la racine du projet : `cd microservices/main`
- Lancer tous les tests : `npm test`
- Lancer les tests avec couverture : `node --experimental-test-coverage --test $(find tests -name '*.test.js' | sort)`

Tests pour data-manager :
- Depuis la racine du projet : `cd microservices/data-manager`
- Lancer tous les tests : `npm test`
- Lancer les tests avec couverture : `npm run test:coverage`