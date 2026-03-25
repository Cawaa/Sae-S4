const express = require('express');
const brainController = require('../controllers/brain.controller');

const router = express.Router();

/**
 * @swagger
 * /api/poi/available-types:
 *   get:
 *     summary: Retourne les types de POI gérés par le brain.
 *     tags:
 *       - POI
 *     responses:
 *       200:
 *         description: Liste des types disponibles.
 */
router.get('/poi/available-types', brainController.getAvailableTypes);

/**
 * @swagger
 * /api/itinerary/plan:
 *   post:
 *     summary: Construit un trajet simplifié entre un départ et une arrivée avec POI intermédiaires.
 *     tags:
 *       - Itinerary
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start
 *               - end
 *             properties:
 *               start:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lon:
 *                     type: number
 *               end:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lon:
 *                     type: number
 *               poiTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxPoi:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Itinéraire simplifié calculé.
 *       400:
 *         description: Requête invalide.
 *       500:
 *         description: Erreur interne.
 */
router.post('/itinerary/plan', brainController.planItinerary);

/**
 * @swagger
 * /api/itinerary/debug:
 *   post:
 *     summary: Retourne les données intermédiaires du brain pour le débogage.
 *     tags:
 *       - Itinerary
 *     responses:
 *       200:
 *         description: Informations de debug.
 */
router.post('/itinerary/debug', brainController.debugPlan);

module.exports = router;
