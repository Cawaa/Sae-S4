const brainService = require('../services/brain.service');
const { validatePlanRequest } = require('../validators/plan.validator');

// Le contrôleur ne décide pas comment calculer l’itinéraire. 
// Il joue uniquement le rôle d’adaptateur HTTP entre Express et le service métier.
const brainController = {

  //renvoyer les types disponibles 
  getAvailableTypes(req, res) {
    res.status(200).json({ types: brainService.getAvailableTypes() });
  },

  //valider la requête avant de lancer buildPlan
  async planItinerary(req, res, next) {
    
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

  //valider la requête avant de lancer debugPlan.
  async debugPlan(req, res, next) {
   
    try {
      const validation = validatePlanRequest(req.body);

      if (!validation.valid) {
        return res.status(400).json({
          error: 'Requête invalide.',
          details: validation.errors
        });
      }

      const result = await brainService.debugPlan(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = brainController;
