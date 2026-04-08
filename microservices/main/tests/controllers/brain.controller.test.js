'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const controllerPath = require.resolve('../../controllers/brain.controller');
const servicePath = require.resolve('../../services/brain.service');
const validatorPath = require.resolve('../../validators/plan.validator');

// Fonction pour charger le contrôleur avec des mocks
function loadControllerWithMocks(serviceMock, validatorMock) {
  delete require.cache[controllerPath];
  delete require.cache[servicePath];
  delete require.cache[validatorPath];

  // Mock du service
  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: serviceMock
  };

  // Mock du validateur
  require.cache[validatorPath] = {
    id: validatorPath,
    filename: validatorPath,
    loaded: true,
    exports: { validatePlanRequest: validatorMock }
  };

  return require('../../controllers/brain.controller');
}

// Fonction utilitaire pour simuler la réponse Express
function mockRes() {
  const res = { _status: 200, _data: null };
  res.status = (code) => { res._status = code; return res; };
  res.json = (data) => { res._data = data; return res; };
  return res;
}

describe('brain.controller', () => {

  test('getAvailableTypes retourne la liste des types 200', async () => {
    const controller = loadControllerWithMocks(
      { getAvailableTypes: () => ['toilettes', 'parkings'] },
      () => ({ valid: true }) // Non utilisé ici
    );

    const req = {};
    const res = mockRes();

    controller.getAvailableTypes(req, res);

    assert.equal(res._status, 200);
    assert.deepEqual(res._data, { types: ['toilettes', 'parkings'] });
  });

  test('planItinerary retourne 400 si la requête est invalide', async () => {
    const controller = loadControllerWithMocks(
      {}, // Pas besoin du service car la validation va échouer avant
      () => ({ valid: false, errors: ['Erreur de test'] })
    );

    const req = { body: {} };
    const res = mockRes();
    const next = () => {};

    await controller.planItinerary(req, res, next);

    assert.equal(res._status, 400);
    assert.equal(res._data.error, 'Requête invalide.');
    assert.deepEqual(res._data.details, ['Erreur de test']);
  });

  test('planItinerary retourne un format geojson si demandé', async () => {
    const fakeResult = {
      selectedPoi: [{ name: 'POI 1', type: 'toilettes', lat: 47.2, lon: -1.5 }],
      route: { segments: [{ from: { lat: 47.1, lon: -1.4 }, to: { lat: 47.2, lon: -1.5 } }] }
    };

    const controller = loadControllerWithMocks(
      { buildPlan: async () => fakeResult },
      () => ({ valid: true, errors: [] })
    );

    const req = { body: { result: 'geojson' } };
    const res = mockRes();
    const next = () => {};

    await controller.planItinerary(req, res, next);

    assert.equal(res._status, 200);
    assert.equal(res._data.type, 'FeatureCollection');
    // On vérifie qu'on a bien une Feature pour la ligne et une pour le POI
    assert.equal(res._data.features.length, 2); 
    assert.equal(res._data.features[0].geometry.type, 'LineString');
    assert.equal(res._data.features[1].geometry.type, 'Point');
  });

  test('planItinerary appelle next(error) si le service lève une exception', async () => {
    const fakeError = new Error('Erreur interne du service');
    const controller = loadControllerWithMocks(
      { buildPlan: async () => { throw fakeError; } },
      () => ({ valid: true, errors: [] })
    );

    const req = { body: {} };
    const res = mockRes();
    
    let caughtError = null;
    const next = (err) => { caughtError = err; };

    await controller.planItinerary(req, res, next);

    assert.equal(caughtError, fakeError);
  });
});