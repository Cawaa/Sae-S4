const axios = require('axios');

const DATA_MANAGER_URL = process.env.DATA_MANAGER_URL || 'http://localhost:3002';

//configuration
const http = axios.create({
  baseURL: DATA_MANAGER_URL,
  timeout: 5000,
  proxy: false
});

function toServiceError(error) {
  // service arrêté, hôte introuvable ou délai dépassé.
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    const mapped = new Error(`Le service data-manager est indisponible (${DATA_MANAGER_URL}).`);
    mapped.status = 503;
    mapped.code = 'DATA_MANAGER_UNAVAILABLE';
    return mapped;
  }

  // Cas où le data-manager a bien répondu, mais avec une erreur HTTP.
  if (error.response) {
    const mapped = new Error(`Le data-manager a renvoyé une erreur ${error.response.status}.`);
    mapped.status = 502;
    mapped.code = 'DATA_MANAGER_BAD_RESPONSE';
    return mapped;
  }

  // Si l'erreur ne correspond à aucun cas prévu, on la propage telle quelle.
  return error;
}

//factorisation de la logique de récupération des POI, avec gestion centralisée des erreurs.
//Le brain ne doit pas connaître les détails HTTP de bas niveau.
async function fetchPoi(params = {}) {
  try {
    const response = await http.get('/api/db/poi', { params });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    // Toute erreur HTTP ou réseau est convertie en erreur métier explicite.
    throw toServiceError(error);
  }
}

// DAO d'accès aux POI stockés dans le data-manager.
const dataManagerDao = {
  // Récupère uniquement les POI d'un type donné.
  async getPoiByType(type) {
    return fetchPoi({ type });
  },

  // Récupère tous les POI disponibles sans filtrage.
  async getAllPoi() {
    return fetchPoi();
  }
};

module.exports = dataManagerDao;