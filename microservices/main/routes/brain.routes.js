const express = require('express');
const brainController = require('../controllers/brain.controller');

const router = express.Router();

/**
 * @swagger
 * /api/poi/available-types:
 *   get:
 *     summary: Retourne les types de POI gérés par le brain.
 *     tags: [POI]
 *     responses:
 *       200:
 *         description: Liste des types disponibles.
 */
router.get('/poi/available-types', brainController.getAvailableTypes);
// Route pour récupérer les types de POI disponibles, 
// utile pour le client afin de savoir quels types de points d'intérêt peuvent être inclus dans les itinéraires.

/**
 * @swagger
 * /api/itinerary/plan:
 *   post:
 *     summary: Construit un trajet simplifié entre un départ et une arrivée avec POI intermédiaires.
 *     tags: [Itinerary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [start, end]
 *             properties:
 *               start:
 *                 type: object
 *               end:
 *                 type: object
 *               poiTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxPoi:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Itinéraire calculé.
 */
router.post('/itinerary/plan', brainController.planItinerary);
// Route principale pour planifier un itinéraire.
// Le client envoie un point de départ, un point d'arrivée, 
// et éventuellement des types de POI à inclure et un nombre maximum de POI.

/**
 * @swagger
 * /api/itinerary/debug:
 *   post:
 *     summary: Retourne les données intermédiaires du brain pour le débogage.
 *     tags: [Itinerary]
 *     responses:
 *       200:
 *         description: Informations de debug.
 */
router.post('/itinerary/debug', brainController.debugPlan);
// Route de debug pour retourner les données intermédiaires du brain.

module.exports = router;
