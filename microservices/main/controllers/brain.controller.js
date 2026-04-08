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

      // On récupère l'option demandée (par défaut 'complete')
      const resultFormat = req.body.result || req.query.result || 'complete';

      // Affichage d'un résultat au format compact contenant seulement les coordonnées et noms des POI puis la route complète des points
      if (resultFormat === 'compact') {
        const pointsChain = [];
        if (result.route && result.route.segments.length > 0) {
          pointsChain.push(result.route.segments[0].from);
          result.route.segments.forEach(segment => {
            pointsChain.push(segment.to);
          });
        }

        return res.status(200).json({
          poi: result.selectedPoi.map(p => ({
            name: p.name,
            type: p.type,
            lat: p.lat,
            lon: p.lon
          })),
          route: pointsChain 
        });
      }

      // Affichage d'un format geojson qui permet de copier le résultat sur le site geojson.io pour avoir une vue de l'itinéraire
      if (resultFormat === 'geojson') {
        const features = [];

        // Ajout du tracé
        const routeCoords = [];
        if (result.route && result.route.segments.length > 0) {
          const firstPoint = result.route.segments[0].from;
          // On passe de {lat, lon} à [lon, lat] car l'ordre de geojson est différent
          routeCoords.push([firstPoint.lon, firstPoint.lat]); 
          result.route.segments.forEach(segment => {
            routeCoords.push([segment.to.lon, segment.to.lat]);
          });
        }

        if (routeCoords.length > 0) {
          features.push({
            type: "Feature",
            properties: { name: "Itinéraire"},
            geometry: {
              type: "LineString",
              coordinates: routeCoords
            }
          });
        }

        // Ajout des Points
        if (result.selectedPoi && result.selectedPoi.length > 0) {
          result.selectedPoi.forEach(p => {
            features.push({
              type: "Feature",
              properties: { 
                name: p.name, 
                type: p.type, 
              },
              geometry: {
                type: "Point",
                // On passe de p.lat, p.lon à [p.lon, p.lat] car l'ordre de geojson est différent
                coordinates: [p.lon, p.lat]
              }
            });
          });
        }

        return res.status(200).json({
          type: "FeatureCollection",
          features: features
        });
      }

      // Si pas de result ou result=complete, on renvoie la réponse complète
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
