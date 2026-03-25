const axios = require('axios');

function getAxiosProxyConfig() {
  const proxyUrl =
    process.env.https_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.http_proxy ||
    process.env.HTTP_PROXY;

  if (!proxyUrl) {
    console.log('[Fetcher][Proxy] Aucun proxy détecté, connexion directe.');
    return {
      timeout: 10000
    };
  }

  try {
    const parsed = new URL(proxyUrl);

    const config = {
      timeout: 10000,
      proxy: {
        protocol: parsed.protocol.replace(':', ''),
        host: parsed.hostname,
        port: parsed.port
          ? Number(parsed.port)
          : parsed.protocol === 'https:'
            ? 443
            : 80
      }
    };

    if (parsed.username || parsed.password) {
      config.proxy.auth = {
        username: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password)
      };
    }

    console.log(`[Fetcher][Proxy] Proxy détecté : ${proxyUrl}`);
    return config;
  } catch (error) {
    console.warn('[Fetcher][Proxy] URL de proxy invalide, connexion directe.');
    return {
      timeout: 10000
    };
  }
}

async function fetchFromNantesAPI(datasetId, limit = 20) {
  const baseUrl = 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets';
  const url = `${baseUrl}/${datasetId}/records?limit=${limit}`;

  const response = await axios.get(url, getAxiosProxyConfig());
  return response.data;
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