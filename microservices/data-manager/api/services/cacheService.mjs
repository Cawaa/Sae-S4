import poiDao from '../dao/poiDao.mjs';
import fetcherDao from '../dao/fetcherDao.mjs';
import { ALLOWED_TYPES, getTtlSeconds } from '../config/cacheConfig.mjs';

// Service principal pour gérer la logique de cache des points d'intérêt (POI)
function assertKnownType(type) {
  if (!ALLOWED_TYPES.includes(type)) {
    const error = new Error(`Type inconnu : ${type}`);
    error.status = 400;
    error.code = 'UNKNOWN_TYPE';
    throw error;
  }
}

// Fonction utilitaire pour vérifier si une entrée de cache est expirée
function isExpired(cacheEntry) {
  if (!cacheEntry?.expiresAt) {
    return true;
  }

  return new Date(cacheEntry.expiresAt).getTime() <= Date.now();
}

// Fonction principale pour rafraîchir les données d'un type de dataset, en forçant une requête au fetcher-opendata et en mettant à jour le cache avec les nouvelles données
async function refreshType(type, initialState = 'CACHE_MISS') {
  assertKnownType(type);

  const stateTrace = ['READ_REQUESTED', initialState, 'FETCHER_REQUESTED'];

  try {
    const fetched = await fetcherDao.fetchDataset(type);

    const items = Array.isArray(fetched?.items) ? fetched.items : [];
    const ttlSeconds = getTtlSeconds(type);
    const fetchedAt = fetched?.fetchedAt ? new Date(fetched.fetchedAt) : new Date();
    const expiresAt = new Date(fetchedAt.getTime() + ttlSeconds * 1000);

    const saved = await poiDao.upsertTypeData(type, items, {
      source: 'fetcher-opendata',
      fetchedAt,
      expiresAt
    });

    stateTrace.push('CACHE_UPDATED');
    stateTrace.push('RESPONSE_READY');

    return {
      state: 'RESPONSE_READY',
      stateTrace,
      type,
      items,
      cache: {
        fetchedAt: saved.fetchedAt,
        expiresAt: saved.expiresAt,
        itemCount: saved.itemCount
      }
    };
  } catch (error) {
    stateTrace.push('REFRESH_FAILED');
    error.stateTrace = stateTrace;
    throw error;
  }
}

// Fonction principale pour s'assurer que les données d'un type de dataset sont fraîches, en vérifiant le cache et en rafraîchissant si nécessaire
async function ensureFreshType(type) {
  assertKnownType(type);

  const existing = await poiDao.findByType(type);

  if (!existing) {
    return refreshType(type, 'CACHE_MISS');
  }

  if (isExpired(existing)) {
    return refreshType(type, 'CACHE_EXPIRED');
  }

  return {
    state: 'RESPONSE_READY',
    stateTrace: ['READ_REQUESTED', 'CACHE_HIT', 'RESPONSE_READY'],
    type,
    items: existing.items || [],
    cache: {
      fetchedAt: existing.fetchedAt,
      expiresAt: existing.expiresAt,
      itemCount: existing.itemCount
    }
  };
}

// Fonction pour inspecter l'état du cache d'un type de dataset donné, en indiquant s'il s'agit d'un cache hit, d'un cache miss ou d'un cache expiré, et en fournissant les métadonnées du cache si disponibles
async function inspectCache(type) {
  assertKnownType(type);

  const existing = await poiDao.findByType(type);

  if (!existing) {
    return {
      state: 'CACHE_MISS',
      type,
      cache: null
    };
  }

  if (isExpired(existing)) {
    return {
      state: 'CACHE_EXPIRED',
      type,
      cache: {
        fetchedAt: existing.fetchedAt,
        expiresAt: existing.expiresAt,
        itemCount: existing.itemCount
      }
    };
  }

  return {
    state: 'CACHE_HIT',
    type,
    cache: {
      fetchedAt: existing.fetchedAt,
      expiresAt: existing.expiresAt,
      itemCount: existing.itemCount
    }
  };
}

// Fonction utilitaire pour récupérer tous les points d'intérêt (POI) actuellement stockés dans le cache, en agrégeant les items de tous les types de dataset
async function getAllCachedPoi() {
  const entries = await poiDao.findAll();
  return entries.flatMap((entry) => entry.items || []);
}

export default {
  ensureFreshType,
  refreshType,
  inspectCache,
  getAllCachedPoi
};