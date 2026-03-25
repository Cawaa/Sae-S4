const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePoi } = require('../../utils/normalizePoi');

test('normalizePoi transforme un enregistrement avec geo_shape.coordinates', () => {
  const raw = {
    nom: 'Toilettes Commerce',
    geo_shape: {
      coordinates: [-1.553, 47.218]
    }
  };

  const normalized = normalizePoi('toilettes', raw);

  assert.equal(normalized.type, 'toilettes');
  assert.equal(normalized.name, 'Toilettes Commerce');
  assert.equal(normalized.lat, 47.218);
  assert.equal(normalized.lon, -1.553);
});

test('normalizePoi retourne null sans coordonnées exploitables', () => {
  const normalized = normalizePoi('parkings', { nom: 'Sans coordonnées' });
  assert.equal(normalized, null);
});
