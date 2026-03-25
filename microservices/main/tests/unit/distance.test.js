const test = require('node:test');
const assert = require('node:assert/strict');
const { haversineDistanceKm, rankPoisBetweenPoints } = require('../../utils/distance');

test('haversineDistanceKm retourne 0 pour deux points identiques', () => {
  const point = { lat: 47.2184, lon: -1.5536 };
  assert.equal(haversineDistanceKm(point, point), 0);
});

test('rankPoisBetweenPoints trie les POI par score croissant', () => {
  const start = { lat: 47.2184, lon: -1.5536 };
  const end = { lat: 47.20, lon: -1.56 };
  const pois = [
    { type: 'toilettes', name: 'loin', lat: 47.30, lon: -1.70 },
    { type: 'toilettes', name: 'proche', lat: 47.217, lon: -1.555 }
  ];

  const ranked = rankPoisBetweenPoints(start, end, pois);
  assert.equal(ranked[0].name, 'proche');
  assert.equal(ranked.length, 2);
});
