const dataManagerDao = require('../dao/dataManager.dao');
const routingDao = require('../dao/routing.dao');
const { rankPoisBetweenPoints } = require('../utils/distance');

const AVAILABLE_TYPES = ['toilettes', 'parkings', 'composteurs'];

// Le service métier du brain. C'est ici que se trouve la logique de calcul d'itinéraire.
// Le contrôleur appelle ces fonctions pour construire la réponse à envoyer au client.

// Normalise et filtre les types de POI demandés par le client pour ne garder que ceux qui sont disponibles.
function normalizeRequestedTypes(poiTypes) {
  if (!Array.isArray(poiTypes) || poiTypes.length === 0) {
    return [];
  }
  return [...new Set(poiTypes.filter((type) => AVAILABLE_TYPES.includes(type)))];
}

// Filtre les POI pour ne garder que les entrées uniques,
// en se basant sur une clé composée avec type + identifiant ou les coordonnées.
function uniquePois(pois) {
  const seen = new Set();// ensemble

  return pois.filter((poi) => {
    const key = poi.sourceId
      ? `${poi.type}:${poi.sourceId}`
      : `${poi.type}:${poi.lat}:${poi.lon}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

// Crée les segments de route à calculer en fonction du point de départ, des POI sélectionnés, et du point d'arrivée.
function createSegments(start, orderedPois, end) {
  const points = [start, ...orderedPois.map((poi) => ({ lat: poi.lat, lon: poi.lon })), end];
  const segments = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    segments.push({
      from: points[index],
      to: points[index + 1]
    });
  }

  return segments;
}

// Fonction pour récupérer les POI d'un type donné depuis le data manager.
async function fetchByType(type) {
  const items = await dataManagerDao.getPoiByType(type);

  return {
    type,
    items: Array.isArray(items) ? items.filter(Boolean) : []
  };
}

// Le service métier du brain. C'est ici que se trouve la logique de calcul d'itinéraire.
const brainService = {
  getAvailableTypes() {
    return AVAILABLE_TYPES;
  },

  async buildPlan(payload) {
    const start = payload.start;
    const end = payload.end;
    const poiTypes = normalizeRequestedTypes(payload.poiTypes);//normalisation des types 
    const maxPoi = Number.isInteger(payload.maxPoi)
      ? payload.maxPoi
      : Number(process.env.MAX_DEFAULT_POI || 3);

    const stateTrace = ['QUERY_RECEIVED', 'QUERY_VALIDATED'];//initialisation de stateTrace pour suivre les étapes du traitement de la requête

    let groupedResults = [];

    if (poiTypes.length > 0) {
      stateTrace.push('DATA_REQUESTED');
      groupedResults = await Promise.all(poiTypes.map((type) => fetchByType(type))); // récupération parallèle des types de POI demandés
      stateTrace.push('DATA_RECEIVED');
    }

    const availablePoi = uniquePois(groupedResults.flatMap((group) => group.items)); //fusion + déduplication des POI disponibles
    stateTrace.push('POI_AGGREGATED');

    //classement par score, puis sélection des meilleurs POI à inclure dans l'itinéraire
    const rankedPois = rankPoisBetweenPoints(start, end, availablePoi).slice(
      0,
      Math.max(0, maxPoi)
    );
    stateTrace.push('POI_SELECTED');

    // On prend les POI sélectionnés et on les trie du plus proche au plus loin du point de départ
    const orderedPois = [...rankedPois].sort((a, b) => {
      const distA = Math.pow(a.lat - start.lat, 2) + Math.pow(a.lon - start.lon, 2);
      const distB = Math.pow(b.lat - start.lat, 2) + Math.pow(b.lon - start.lon, 2);
      return distA - distB; // Ordre croissant
    });

    const routeSegments = createSegments(start, orderedPois, end); //création des segments
    const route = await routingDao.buildRoute(routeSegments); //construction de la route,

    stateTrace.push('ROUTE_BUILT');
    stateTrace.push('RESPONSE_READY');

    //renvoi d’une réponse complète avec les données de l’itinéraire et un résumé du traitement effectué avec stateTrace pour le suivi des étapes du traitement de la requête, les POI sélectionnés, et les informations sur la route calculée.
    return {
      state: 'RESPONSE_READY',
      stateTrace,
      request: {
        start,
        end,
        poiTypes,
        maxPoi
      },
      summary: {
        requestedTypeCount: poiTypes.length,
        availablePoiCount: availablePoi.length,
        selectedPoiCount: orderedPois.length,
        routingProvider: route.provider
      },
      selectedPoi: orderedPois,
      route
    };
  },

  //même logique que buildPlan mais avec un retour plus détaillé pour le debug,
  // incluant les données intermédiaires comme le nombre de POI récupérés par type, 
  // le total de POI disponibles après fusion, et les POI sélectionnés avant même de construire la route.
  async debugPlan(payload) {
    const start = payload.start;
    const end = payload.end;
    const poiTypes = normalizeRequestedTypes(payload.poiTypes);
    const maxPoi = Number.isInteger(payload.maxPoi)
      ? payload.maxPoi
      : Number(process.env.MAX_DEFAULT_POI || 3);

    const fetchedByType = {};
    const groupedResults = await Promise.all(poiTypes.map((type) => fetchByType(type)));

    for (const group of groupedResults) {
      fetchedByType[group.type] = group.items.length;
    }

    const merged = uniquePois(groupedResults.flatMap((group) => group.items));
    const ranked = rankPoisBetweenPoints(start, end, merged).slice(0, Math.max(0, maxPoi));

    return {
      request: {
        start,
        end,
        poiTypes,
        maxPoi
      },
      fetchedByType,
      totalAvailable: merged.length,
      normalizedPreview: ranked
    };
  }
};

module.exports = brainService;