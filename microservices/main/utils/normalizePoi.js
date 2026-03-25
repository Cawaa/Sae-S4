function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function pickCoordinates(raw) {
  // Cas 1 : geo_shape.coordinates = [lon, lat]
  if (Array.isArray(raw.geo_shape?.coordinates) && raw.geo_shape.coordinates.length >= 2) {
    const [lon, lat] = raw.geo_shape.coordinates;
    if (isValidNumber(lat) && isValidNumber(lon)) {
      return { lat, lon };
    }
  }

  // Cas 2 : geo_shape.geometry.coordinates = [lon, lat]
  if (
    Array.isArray(raw.geo_shape?.geometry?.coordinates) &&
    raw.geo_shape.geometry.coordinates.length >= 2
  ) {
    const [lon, lat] = raw.geo_shape.geometry.coordinates;
    if (isValidNumber(lat) && isValidNumber(lon)) {
      return { lat, lon };
    }
  }

  // Cas 3 : geo_point_2d = { lat, lon }
  if (isValidNumber(raw.geo_point_2d?.lat) && isValidNumber(raw.geo_point_2d?.lon)) {
    return {
      lat: raw.geo_point_2d.lat,
      lon: raw.geo_point_2d.lon
    };
  }

  // Cas 4 : geo_point_2d = [lat, lon]
  if (Array.isArray(raw.geo_point_2d) && raw.geo_point_2d.length >= 2) {
    const [lat, lon] = raw.geo_point_2d;
    if (isValidNumber(lat) && isValidNumber(lon)) {
      return { lat, lon };
    }
  }

  // Cas 5 : location = [lat, lon]
  if (Array.isArray(raw.location) && raw.location.length >= 2) {
    const [lat, lon] = raw.location;
    if (isValidNumber(lat) && isValidNumber(lon)) {
      return { lat, lon };
    }
  }

  // Cas 6 : champs plats lat/lon
  if (isValidNumber(raw.lat) && isValidNumber(raw.lon)) {
    return { lat: raw.lat, lon: raw.lon };
  }

  // Cas 7 : champs plats latitude/longitude
  if (isValidNumber(raw.latitude) && isValidNumber(raw.longitude)) {
    return { lat: raw.latitude, lon: raw.longitude };
  }

  // Cas 8 : géométrie alternative
  if (
    Array.isArray(raw.geometry?.coordinates) &&
    raw.geometry.coordinates.length >= 2
  ) {
    const [lon, lat] = raw.geometry.coordinates;
    if (isValidNumber(lat) && isValidNumber(lon)) {
      return { lat, lon };
    }
  }

  return null;
}

function pickName(type, raw) {
  return (
    raw.nom ||
    raw.name ||
    raw.libelle ||
    raw.adresse ||
    raw.idobj ||
    raw.identifiant ||
    `${type}-sans-nom`
  );
}

function normalizePoi(type, raw) {
  const coordinates = pickCoordinates(raw);

  if (!coordinates) {
    return null;
  }

  return {
    type,
    name: pickName(type, raw),
    lat: coordinates.lat,
    lon: coordinates.lon,
    address:
      raw.adresse ||
      raw.address ||
      raw.commune ||
      raw.quartier ||
      null,
    raw
  };
}

module.exports = {
  normalizePoi
};