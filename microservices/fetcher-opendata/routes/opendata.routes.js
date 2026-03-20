const express = require('express');

const router = express.Router();
const openDataController = require('../controllers/opendata.controller');

// Association des routes aux methodes du controleur
router.get('/toilettes', openDataController.getToilettes);
router.get('/parkings', openDataController.getParkings);
router.get('/composteurs', openDataController.getComposteurs);

module.exports = router;
