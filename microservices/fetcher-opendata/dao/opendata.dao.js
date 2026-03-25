const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

function buildFetchOptions() {
  const proxy = process.env.https_proxy || process.env.HTTPS_PROXY;

  if (proxy) {
    console.log(`[Fetcher][Proxy] Proxy détecté : ${proxy}`);
    return {
      agent: new HttpsProxyAgent(proxy)
    };
  }

  console.log('[Fetcher][Proxy] Aucun proxy détecté, connexion directe.');
  return {};
}

async function fetchFromNantesAPI(datasetId, limit = 20) {
  const baseUrl = 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets';
  const url = `${baseUrl}/${datasetId}/records?limit=${limit}`;

  const response = await fetch(url, buildFetchOptions());

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Erreur API Nantes: ${response.status} - ${body}`);
  }

  return response.json();
}

const openDataDAO = {
  getToilettes: async () => {
    return fetchFromNantesAPI('244400404_toilettes-publiques-nantes-metropole');
  },

  getParkings: async () => {
    return fetchFromNantesAPI('244400404_parkings-publics-nantes-disponibilites');
  },

  getComposteurs: async () => {
    return fetchFromNantesAPI('512042839_composteurs-quartier-nantes-metropole');
  }
};

module.exports = openDataDAO;