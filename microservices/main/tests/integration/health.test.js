const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../app');

test('GET /api/health retourne 200', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('POST /api/itinerary/plan retourne 400 si le body est invalide', async () => {
  const response = await request(app)
    .post('/api/itinerary/plan')
    .send({ start: { lat: 47.2 }, end: { lat: 47.1, lon: -1.5 } });

  assert.equal(response.status, 400);
  assert.equal(Array.isArray(response.body.details), true);
});
