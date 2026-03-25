const dataManagerDao = require('../dao/dataManager.dao');
const routingDao = require('../dao/routing.dao');
const { normalizePoi } = require('../utils/normalizePoi');
const { rankPoisBetweenPoints } = require('../utils/distance');

const AVAILABLE_TYPES = ['toilettes', 'parkings', 'composteurs'];

function uniqueByCoordinates(pois) {
  const seen = new Set();
  return pois.filter((poi) => {
    const key = `${poi.type}:${poi.lat}:${poi.lon}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createSegments(start, orderedPois, end) {
  const points = [start, ...orderedPois.map((poi) => ({ lat: poi.lat, lon: poi.lon })), end];
  const segments = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    segments.push({
      from: points[i],
      to: points[i + 1]
    });
  }

  return segments;
}

const brainService = {
  /**
   * Retourne les types de POI officiellement gérés par le brain.
   */
  getAvailableTypes() {
    return AVAILABLE_TYPES;
  },

  /**
   * Construit un plan d'itinéraire simple.
   * MVP :
   * 1. récupère les POI depuis le Data Manager ;
   * 2. normalise les données ;
   * 3. garde les plus proches du trajet ;
   * 4. retourne un JSON métier propre.
   */
  async buildPlan(payload) {
    const start = payload.start;
    const end = payload.end;
    const poiTypes = Array.isArray(payload.poiTypes) && payload.poiTypes.length > 0
      ? payload.poiTypes.filter((type) => AVAILABLE_TYPES.includes(type))
      : [];

    const maxPoi = Number.isInteger(payload.maxPoi)
      ? payload.maxPoi
      : Number(process.env.MAX_DEFAULT_POI || 3);

    let normalizedPois = [];

    if (poiTypes.length > 0) {
      const groupedResults = await Promise.all(
        poiTypes.map(async (type) => {
          const rawPois = await dataManagerDao.getPoiByType(type);
          return rawPois
            .map((item) => normalizePoi(type, item))
            .filter(Boolean);
        })
      );

      normalizedPois = uniqueByCoordinates(groupedResults.flat());
    }

    const rankedPois = rankPoisBetweenPoints(start, end, normalizedPois).slice(0, Math.max(0, maxPoi));
    const routeSegments = createSegments(start, rankedPois, end);
    const route = await routingDao.buildRoute(routeSegments);

    return {
      request: {
        start,
        end,
        poiTypes,
        maxPoi
      },
      summary: {
        availablePoiCount: normalizedPois.length,
        selectedPoiCount: rankedPois.length,
        routingProvider: route.provider
      },
      selectedPoi: rankedPois,
      route
    };
  },

  /**
   * Retourne les étapes intermédiaires pour le débogage.
   */
  async debugPlan(payload) {
    const start = payload.start;
    const end = payload.end;
    const poiTypes = Array.isArray(payload.poiTypes) ? payload.poiTypes : [];

    const fetchedByType = {};
    const normalizedByType = {};

    for (const type of poiTypes) {
      const rawPois = await dataManagerDao.getPoiByType(type);
      fetchedByType[type] = rawPois.length;
      normalizedByType[type] = rawPois.map((item) => normalizePoi(type, item)).filter(Boolean);
    }

    const merged = uniqueByCoordinates(Object.values(normalizedByType).flat());
    const ranked = rankPoisBetweenPoints(start, end, merged).slice(0, payload.maxPoi || 3);

    return {
      request: payload,
      fetchedByType,
      normalizedPreview: ranked,
      totalNormalized: merged.length
    };
  }
};

module.exports = brainService;
