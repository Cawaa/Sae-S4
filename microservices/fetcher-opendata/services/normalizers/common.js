// Retourne la valeur trouvée à partir d'un chemin pointé (ex: "a.b.c") dans un objet, ou null si le chemin n'existe pas.
function getByPath(object, path) {
  if (!object || !path) {
    return null;
  }

  const segments = path.split('.');
  let current = object;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return null;
    }

    current = current[segment];
  }

  return current ?? null;
}

// Retourne true si la valeur n'est ni undefined ni null.
function isDefined(value) {
  return value !== undefined && value !== null;
}

// Parcourt une liste de sélecteurs et renvoie la première valeur définie et non vide trouvée.
function pickFirst(record, selectors = []) {
  for (const selector of selectors) {
    let value = null;

    if (typeof selector === 'function') {
      value = selector(record);
    } else if (typeof selector === 'string') {
      value = getByPath(record, selector);
    }

    if (!isDefined(value)) {
      continue;
    }

    if (typeof value === 'string' && value.trim() === '') {
      continue;
    }

    return value;
  }

  return null;
}

// Normalise une valeur en chaîne trimée ou renvoie null si indéfinie/vides.
function asString(value) {
  if (!isDefined(value)) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
}

// Convertit en nombre (gère les virgules) et renvoie null si non convertible ou invalide.
function asNumber(value) {
  if (!isDefined(value) || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value).trim().replace(',', '.');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

// Supprime les clés dont les valeurs sont null, undefined, chaîne vide ou objet vide.
function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }

      if (typeof value === 'string' && value.trim() === '') {
        return false;
      }

      if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
      ) {
        return false;
      }

      return true;
    })
  );
}

// Vérifie si un nombre est une latitude plausible entre -90 et 90.
function isPlausibleLatitude(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
}

// Vérifie si un nombre est une longitude plausible entre -180 et 180.
function isPlausibleLongitude(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;
}

// Tente d'extraire des coordonnées depuis un tableau [x, y] ou [lat, lon], retourne {lat, lon} ou null.
function fromCoordinateArray(value) {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const first = asNumber(value[0]);
  const second = asNumber(value[1]);

  if (first === null || second === null) {
    return null;
  }

  if (isPlausibleLatitude(first) && isPlausibleLongitude(second)) {
    return { lat: first, lon: second };
  }

  if (isPlausibleLatitude(second) && isPlausibleLongitude(first)) {
    return { lat: second, lon: first };
  }

  return null;
}

// Lit un objet contenant des clés de lat/lon variées et renvoie {lat, lon} si valide.
function readLatLonObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const lat = asNumber(
    value.lat ??
    value.latitude ??
    value.y ??
    value.north ??
    value.nord
  );

  const lon = asNumber(
    value.lon ??
    value.lng ??
    value.long ??
    value.longitude ??
    value.x ??
    value.east ??
    value.est
  );

  if (lat !== null && lon !== null && isPlausibleLatitude(lat) && isPlausibleLongitude(lon)) {
    return { lat, lon };
  }

  return null;
}

// Indique si un objet possède au moins une clé évoquant des données géographiques.
function hasGeoLikeKey(object) {
  if (!object || typeof object !== 'object') {
    return false;
  }

  return Object.keys(object).some((key) =>
    /(geo|coord|location|point|shape|geometry|position|centroid|centre|center|lat|lon|lng|longitude|latitude)/i.test(key)
  );
}

// Parcourt récursivement un objet/ tableau pour trouver des coordonnées, en évitant les cycles et en limitant la profondeur.
function findCoordinatesDeep(value, depth = 0, visited = new Set()) {
  if (!isDefined(value) || depth > 6) {
    return null;
  }

  if (typeof value === 'object') {
    if (visited.has(value)) {
      return null;
    }
    visited.add(value);
  }

  const fromObject = readLatLonObject(value);
  if (fromObject) {
    return fromObject;
  }

  const fromArray = fromCoordinateArray(value);
  if (fromArray) {
    return fromArray;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findCoordinatesDeep(item, depth + 1, visited);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  if (value && typeof value === 'object') {
    if (Array.isArray(value.coordinates)) {
      const fromCoordinates = fromCoordinateArray(value.coordinates);
      if (fromCoordinates) {
        return fromCoordinates;
      }
    }

    if (value.geometry) {
      const fromGeometry = findCoordinatesDeep(value.geometry, depth + 1, visited);
      if (fromGeometry) {
        return fromGeometry;
      }
    }

    if (value.geo_shape) {
      const fromGeoShape = findCoordinatesDeep(value.geo_shape, depth + 1, visited);
      if (fromGeoShape) {
        return fromGeoShape;
      }
    }

    if (value.geo_point_2d) {
      const fromGeoPoint = findCoordinatesDeep(value.geo_point_2d, depth + 1, visited);
      if (fromGeoPoint) {
        return fromGeoPoint;
      }
    }

    const entries = Object.entries(value);

    const geoEntries = entries.filter(([key]) =>
      /(geo|coord|location|point|shape|geometry|position|centroid|centre|center|lat|lon|lng|longitude|latitude)/i.test(key)
    );

    for (const [, nestedValue] of geoEntries) {
      const nested = findCoordinatesDeep(nestedValue, depth + 1, visited);
      if (nested) {
        return nested;
      }
    }

    if (hasGeoLikeKey(value)) {
      for (const [, nestedValue] of entries) {
        const nested = findCoordinatesDeep(nestedValue, depth + 1, visited);
        if (nested) {
          return nested;
        }
      }
    }
  }

  return null;
}

// Lit des coordonnées depuis un enregistrement en essayant des sélecteurs explicites puis des champs génériques.
function readCoordinates(record, options = {}) {
  const lat = asNumber(pickFirst(record, options.latSelectors || []));
  const lon = asNumber(pickFirst(record, options.lonSelectors || []));

  if (lat !== null && lon !== null && isPlausibleLatitude(lat) && isPlausibleLongitude(lon)) {
    return { lat, lon };
  }

  const explicitCandidates = [
    pickFirst(record, options.geoPointObjectSelectors || []),
    pickFirst(record, options.geoPointArraySelectors || []),
    pickFirst(record, options.geometrySelectors || [])
  ];

  for (const candidate of explicitCandidates) {
    const coords = findCoordinatesDeep(candidate);
    if (coords) {
      return coords;
    }
  }

  const genericCandidates = [
    record?.geo_point_2d,
    record?.location,
    record?.geometry,
    record?.geo_shape,
    record?.coordonnees,
    record?.coords,
    record?.position,
    record
  ];

  for (const candidate of genericCandidates) {
    const coords = findCoordinatesDeep(candidate);
    if (coords) {
      return coords;
    }
  }

  return null;
}

// Normalise un enregistrement en POI standardisé {type, sourceDataset, sourceId, name, lat, lon, ...} ou renvoie null si pas de coordonnées.
function normalizePoi(record, config) {
  const coordinates = readCoordinates(record, config);

  if (!coordinates) {
    return null;
  }

  const sourceId =
    asString(pickFirst(record, config.idSelectors)) ||
    `${config.type}:${coordinates.lat}:${coordinates.lon}`;

  const name =
    asString(pickFirst(record, config.nameSelectors)) ||
    `${config.type}-${sourceId}`;

  const extra =
    typeof config.extra === 'function'
      ? compactObject(
          config.extra(record, {
            pickFirst,
            asString,
            asNumber,
            getByPath,
            compactObject
          })
        )
      : undefined;

  return compactObject({
    type: config.type,
    sourceDataset: config.datasetKey,
    sourceId,
    name,
    lat: coordinates.lat,
    lon: coordinates.lon,
    address: asString(pickFirst(record, config.addressSelectors)),
    city: asString(pickFirst(record, config.citySelectors)),
    postcode: asString(pickFirst(record, config.postcodeSelectors)),
    accessibility: asString(pickFirst(record, config.accessibilitySelectors)),
    openingHours: asString(pickFirst(record, config.openingHoursSelectors)),
    extra
  });
}

// Extrait un tableau d'enregistrements depuis différentes formes de payload (array, results, records, data, features).
function extractRecords(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.records)) {
    return payload.records;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.features)) {
    return payload.features;
  }

  return [];
}

module.exports = {
  getByPath,
  pickFirst,
  asString,
  asNumber,
  compactObject,
  readCoordinates,
  normalizePoi,
  extractRecords
};