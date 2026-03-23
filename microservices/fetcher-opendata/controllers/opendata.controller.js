const axios = require('axios');
const openDataDAO = require('../dao/opendata.dao');

// Récupérer l'URL du Data Manager depuis le .env
const DATA_MANAGER_URL = process.env.DATA_MANAGER_URL || 'http://localhost:3002';

const openDataController = {
    getToilettes: async (req, res) => {
        try {
            console.log('[Fetcher] Appel vers l\'OpenData de Nantes pour les toilettes...');
            
            // 1. Récupération depuis l'API OpenData de Nantes
            const data = await openDataDAO.getToilettes();
            const toilettesData = data.results || data;

            // 2. ENVOI DES DONNÉES AU DATA MANAGER
            console.log('[Fetcher] Envoi des données au Data Manager...');
            await axios.post(`${DATA_MANAGER_URL}/api/db/poi`, {
                type: 'toilettes',
                data: Array.isArray(toilettesData) ? toilettesData : [toilettesData]
            });

            res.status(200).json({ 
                message: 'Succès : Données récupérées et sauvegardées dans le Data Manager.',
                count: Array.isArray(toilettesData) ? toilettesData.length : 1
            });
        } catch (error) {
            console.error('[Erreur Fetcher Toilettes] :', error.message);
            res.status(500).json({ error: 'Erreur lors de la récupération ou de la sauvegarde des toilettes' });
        }
    },

    getParkings: async (req, res) => {
        try {
            console.log('[Fetcher] Appel vers l\'OpenData de Nantes pour les parkings...');
            
            const data = await openDataDAO.getParkings();
            const parkingsData = data.results || data;

            console.log('[Fetcher] Envoi des données au Data Manager...');
            await axios.post(`${DATA_MANAGER_URL}/api/db/poi`, {
                type: 'parkings',
                data: Array.isArray(parkingsData) ? parkingsData : [parkingsData]
            });

            res.status(200).json({ 
                message: 'Succès : Données récupérées et sauvegardées dans le Data Manager.',
                count: Array.isArray(parkingsData) ? parkingsData.length : 1
            });
        } catch (error) {
            console.error('[Erreur Fetcher Parkings] :', error.message);
            res.status(500).json({ error: 'Erreur lors de la récupération ou de la sauvegarde des parkings' });
        }
    },

    getComposteurs: async (req, res) => {
        try {
            console.log('[Fetcher] Appel vers l\'OpenData de Nantes pour les composteurs...');
            
            const data = await openDataDAO.getComposteurs();
            const composteurData = data.results || data;

            console.log('[Fetcher] Envoi des données au Data Manager...');
            await axios.post(`${DATA_MANAGER_URL}/api/db/poi`, {
                type: 'composteurs',
                data: Array.isArray(composteurData) ? composteurData : [composteurData]
            });

            res.status(200).json({ 
                message: 'Succès : Données récupérées et sauvegardées dans le Data Manager.',
                count: Array.isArray(composteurData) ? composteurData.length : 1
            });
        } catch (error) {
            console.error('[Erreur Fetcher Composteurs] :', error.message);
            res.status(500).json({ error: 'Erreur lors de la récupération ou de la sauvegarde des composteurs' });
        }
    }
};

module.exports = openDataController;
