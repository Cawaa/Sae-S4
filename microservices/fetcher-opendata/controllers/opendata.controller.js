const openDataDAO = require('../dao/opendata.dao');

const openDataController = {
    getToilettes: async (req, res) => {
        try {
            const data = await openDataDAO.getToilettes();
            res.status(200).json(data);
        } catch (error) {
            console.error('Erreur toilettes :', error);
            res.status(500).json({ error: 'Erreur lors de la recuperation des toilettes' });
        }
    },

    getParkings: async (req, res) => {
        try {
            const data = await openDataDAO.getParkings();
            res.status(200).json(data);
        } catch (error) {
            console.error('Erreur parkings :', error);
            res.status(500).json({ error: 'Erreur lors de la recuperation des parkings' });
        }
    },

    getComposteurs: async (req, res) => {
        try {
            const data = await openDataDAO.getComposteurs();
            res.status(200).json(data);
        } catch (error) {
            console.error('Erreur composteurs :', error);
            res.status(500).json({ error: 'Erreur lors de la recuperation des composteurs' });
        }
    }
};

module.exports = openDataController;
