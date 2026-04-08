import express from 'express';
import poiController from '../controller/poiController.mjs';

const router = express.Router();

// Routes pour les points d'intérêt (POI) et l'inspection du cache
router.get('/poi', poiController.getPOI);
router.get('/cache/:type', poiController.getCacheInfo);

export default router;