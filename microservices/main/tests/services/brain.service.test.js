'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const servicePath = require.resolve('../../services/brain.service');
const dataManagerDaoPath = require.resolve('../../dao/dataManager.dao');
const routingDaoPath = require.resolve('../../dao/routing.dao');

function loadServiceWithMocks(dataManagerMock, routingMock) {
  delete require.cache[servicePath];
  delete require.cache[dataManagerDaoPath];
  delete require.cache[routingDaoPath];

  require.cache[dataManagerDaoPath] = {
    id: dataManagerDaoPath, filename: dataManagerDaoPath, loaded: true,
    exports: dataManagerMock
  };

  require.cache[routingDaoPath] = {
    id: routingDaoPath, filename: routingDaoPath, loaded: true,
    exports: routingMock
  };

  return require('../../services/brain.service');
}

describe('brain.service', () => {

  test('getAvailableTypes renvoie bien le tableau des types', () => {
    const service = loadServiceWithMocks({}, {});
    const types = service.getAvailableTypes();
    assert.ok(types.includes('toilettes'));
    assert.ok(types.includes('parkings'));
  });

  test('buildPlan agrège correctement les données et calcule un trajet', async () => {
    // 1. Mock du dataManager pour simuler 2 POI retournés
    const mockDataManager = {
      getPoiByType: async (type) => {
        if (type === 'toilettes') return [{ lat: 47.21, lon: -1.55, type: 'toilettes', name: 'T1' }];
        return [];
      }
    };

    // 2. Mock du router pour simuler un segment
    const mockRouting = {
      buildRoute: async (segments) => ({ provider: 'mock', segments })
    };

    const service = loadServiceWithMocks(mockDataManager, mockRouting);

    const payload = {
      start: { lat: 47.20, lon: -1.50 },
      end: { lat: 47.25, lon: -1.60 },
      poiTypes: ['toilettes'],
      maxPoi: 1
    };

    const result = await service.buildPlan(payload);

    // Vérifications
    assert.equal(result.state, 'RESPONSE_READY');
    assert.equal(result.summary.requestedTypeCount, 1);
    assert.equal(result.summary.availablePoiCount, 1);
    assert.equal(result.selectedPoi.length, 1);
    assert.equal(result.selectedPoi[0].name, 'T1');
    assert.ok(result.stateTrace.includes('ROUTE_BUILT'));
  });
});