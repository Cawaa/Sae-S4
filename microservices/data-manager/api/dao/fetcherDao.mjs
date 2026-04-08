import axios from 'axios';

const FETCHER_URL = process.env.FETCHER_URL || 'http://localhost:3001';

// Création d'une instance Axios configurée pour communiquer avec le fetcher-opendata
const http = axios.create({
  baseURL: FETCHER_URL,
  timeout: 10000,
  proxy: false
});


// Fonction utilitaire pour convertir les erreurs Axios en erreurs plus compréhensibles pour le client
function toFetcherError(error) {
  if (!error.response) {
    const mapped = new Error(`Le fetcher-opendata est indisponible (${FETCHER_URL}).`);
    mapped.status = 503;
    mapped.code = 'FETCHER_UNAVAILABLE';
    return mapped;
  } else {
    const mapped = new Error(
      `Le fetcher-opendata a renvoyé une erreur ${error.response.status}.`
    );
    mapped.status = 502;
    mapped.code = 'FETCHER_BAD_RESPONSE';
    return mapped;
  }
}

// DAO principal pour interagir avec le fetcher-opendata
const fetcherDao = {
  async fetchDataset(type) {
    try {
      const response = await http.get(`/internal/fetch/${type}`);
      return response.data;
    } catch (error) {
      throw toFetcherError(error);
    }
  }
};

export default fetcherDao;