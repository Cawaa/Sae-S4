import POICacheModel from '../model/poiModel.mjs';

// DAO principal pour interagir avec la collection de cache des points d'intérêt (POI) dans MongoDB
const poiDao = {
  async findByType(type) {
    return POICacheModel.findOne({ type }).lean();
  },

  // Récupère tous les documents de cache, sans filtrer par type
  async findAll() {
    return POICacheModel.find({}).lean();
  },

  // Insère ou met à jour les données d'un type de dataset dans le cache, en utilisant une opération upsert
  async upsertTypeData(type, items, metadata = {}) {
    return POICacheModel.findOneAndUpdate(
      { type },
      {
        type,
        items,
        itemCount: Array.isArray(items) ? items.length : 0,
        source: metadata.source || 'fetcher-opendata',
        fetchedAt: metadata.fetchedAt || new Date(),
        expiresAt: metadata.expiresAt || new Date()
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    ).lean();
  }
};

export default poiDao;
