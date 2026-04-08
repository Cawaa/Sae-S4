function toRadians(value) {//degré en radians
  return (value * Math.PI) / 180;
}

// Calcule la distance en kilomètres entre deux points géographiques en utilisant la formule de Haversine.
// la formule : distance = 2 * R * arcsin(sqrt(a)) 
const EARTH_RADIUS_KM = 6371;
function haversineDistanceKm(pointA, pointB) {
  const latDiff = toRadians(pointB.lat - pointA.lat);
  const lonDiff = toRadians(pointB.lon - pointA.lon);

  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(toRadians(pointA.lat)) *
      Math.cos(toRadians(pointB.lat)) *
      Math.sin(lonDiff / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

// Classe les POIs en fonction de leur proximité au trajet défini par start et end.
function rankPoisBetweenPoints(start, end, pois) {
  return pois
    .map((poi) => {
      const distanceFromStart = haversineDistanceKm(start, poi);//calcule la distance départ → POI,
      const distanceToEnd = haversineDistanceKm(poi, end);//calcule la distance POI → arrivée,

      return {
        ...poi,
        scoreKm: Number((distanceFromStart + distanceToEnd).toFixed(3)),//additionne les deux pour obtenir scoreKm
        distanceFromStartKm: Number(distanceFromStart.toFixed(3)),
        distanceToEndKm: Number(distanceToEnd.toFixed(3))
      };
    })
    .sort((a, b) => a.scoreKm - b.scoreKm);//trie par score croissant.
}

module.exports = {
  haversineDistanceKm,
  rankPoisBetweenPoints
};

//Plus la somme distance départ-POI et POI-arrivée est faible, plus le POI est considéré comme intéressant dans le contexte du trajet.
