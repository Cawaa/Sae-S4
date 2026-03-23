import poiDao from '../dao/poiDAO.mjs';

const poiController = {
    // Sauvegarder les données envoyées par le Fetcher
    savePOI: async (req, res) => {
        const { type, data } = req.body;

        if (!type || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Format invalide. { type: "...", data: [...] } attendu.' });
        }

        try {
            await poiDao.replaceTypeData(type, data);
            res.status(201).json({ message: `${data.length} éléments de type '${type}' sauvegardés en mémoire.` });
        } catch (error) {
            console.error('[Erreur DB Save] :', error);
            res.status(500).json({ error: 'Erreur lors de la sauvegarde.' });
        }
    },

    // Récupérer les données (utilisé par l'Agrégateur)
    getPOI: async (req, res) => {
        const { type } = req.query; // Permet de faire : /api/db/poi?type=toilettes

        try {
            let result;
            if (type) {
                result = await poiDao.findByType(type);
            } else {
                result = await poiDao.findAll();
            }
            
            // On ne renvoie au client que le contenu de l'attribut "data" pour retrouver le JSON OpenData pur
            const formattedResult = result.map(doc => doc.data);
            res.status(200).json(formattedResult);
        } catch (error) {
            console.error('[Erreur DB Get] :', error);
            res.status(500).json({ error: 'Erreur lors de la récupération.' });
        }
    }
};

export default poiController;
