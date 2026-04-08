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

      // On regarde si compact=true
      const wantsCompact = req.body.compact === true || req.query.compact === 'true';

      if (wantsCompact) { // Affichage d'un résultat rétréci contenant seulement les coordonnées et noms des POI puis la route complète des points
        const pointsChain = [];
        
        if (result.route && result.route.segments.length > 0) {
          pointsChain.push(result.route.segments[0].from);
          
          result.route.segments.forEach(segment => {
            pointsChain.push(segment.to);
          });
        }

        const compactResponse = {
          poi: result.selectedPoi.map(p => ({
            name: p.name,
            type: p.type,
            lat: p.lat,
            lon: p.lon
          })),
          // On remplace les segments par notre chaîne de points
          route: pointsChain 
        };
        
        return res.status(200).json(compactResponse);
      }

      // Si pas de compact ou compact=false, on renvoie la réponse complète par défaut
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
