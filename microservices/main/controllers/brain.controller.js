const brainService = require('../services/brain.service');
const { validatePlanRequest } = require('../validators/plan.validator');

const brainController = {
  /**
   * Retourne les types de POI que le microservice sait manipuler.
   */
  getAvailableTypes: (req, res) => {
    res.status(200).json({
      types: brainService.getAvailableTypes()
    });
  },

  /**
   * Route principale de planification d'itinéraire.
   */
  planItinerary: async (req, res, next) => {
    try {
      const validation = validatePlanRequest(req.body);

      if (!validation.valid) {
        return res.status(400).json({
          error: 'Requête invalide.',
          details: validation.errors
        });
      }

      const result = await brainService.buildPlan(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Variante de debug : utile pour montrer à l'oral ce qui est récupéré et filtré.
   */
  debugPlan: async (req, res, next) => {
    try {
      const validation = validatePlanRequest(req.body);

      if (!validation.valid) {
        return res.status(400).json({
          error: 'Requête invalide.',
          details: validation.errors
        });
      }

      const debug = await brainService.debugPlan(req.body);
      res.status(200).json(debug);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = brainController;
