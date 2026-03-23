import POIModel from '../model/poiModel.mjs';

const poiDao = {
    // Récupère les données d'un type précis
    findByType: async (type) => {
        return await POIModel.find({ type: type });
    },

    // Récupère toutes les données en base
    findAll: async () => {
        return await POIModel.find({});
    },

    // Remplace les anciennes données d'un type par les nouvelles (venant du fetcher)
    replaceTypeData: async (type, dataArray) => {
        // 1. Suppression des anciennes données pour éviter les doublons
        await POIModel.deleteMany({ type: type });
        
        // 2. Formatage pour que chaque élément ait bien son "type"
        const docs = dataArray.map(item => ({
            type: type,
            data: item
        }));
        
        // 3. Insertion en masse des nouvelles données
        return await POIModel.insertMany(docs);
    }
};

export default poiDao;
