/**
 * DAO de routing.
 *
 * Pour le MVP de la SAE, on renvoie un trajet interne simplifié.
 * Plus tard, ce fichier pourra appeler OSRM, OpenRouteService,
 * ou un autre microservice dédié au calcul de route.
 */
const routingDao = {
  async buildRoute(segments) {
    return {
      provider: process.env.ROUTING_PROVIDER || 'internal',
      mode: 'mvp-direct',
      segments,
      note: 'Trajet simplifié : aucune API externe de routing utilisée pour le moment.'
    };
  }
};

module.exports = routingDao;
