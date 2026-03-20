// Fonction générique pour interroger l'API de Nantes
async function fetchFromNantesAPI(datasetId, limit = 20) {
    const baseUrl = 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets';
    const url = `${baseUrl}/${datasetId}/records?limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur API Nantes: ${response.status}`);
    }

    return response.json();
}

const openDataDAO = {
    // Recuperer les toilettes
    getToilettes: async () => {
        return fetchFromNantesAPI('244400404_toilettes-publiques-nantes-metropole');
    },

    // Recuperer les parkings
    getParkings: async () => {
        return fetchFromNantesAPI('244400404_parkings-publics-nantes-disponibilites');
    },

    // Recuperer les composteurs
    getComposteurs: async () => {
        return fetchFromNantesAPI('512042839_composteurs-quartier-nantes-metropole');
    }
};

module.exports = openDataDAO;
