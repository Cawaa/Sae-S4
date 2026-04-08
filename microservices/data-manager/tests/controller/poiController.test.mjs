import { test, describe, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import poiController from '../../api/controller/poiController.mjs';
import cacheService from '../../api/services/cacheService.mjs';

describe('poiController', () => {
  let req, res, next;

  // Réinitialisation des mocks avant chaque test
  beforeEach(() => {
    req = { query: {}, params: {} };
    res = {
      status: mock.fn(() => res),
      json: mock.fn()
    };
    next = mock.fn();
    mock.restoreAll(); // Nettoyage des mocks précédents
  });

  describe('getPOI', () => {
    test('devrait renvoyer les données spécifiques à un type', async () => {
      req.query.type = 'composteurs';
      const mockResult = { items: [{ id: 1, name: 'Compost 1' }] };
      mock.method(cacheService, 'ensureFreshType', async () => mockResult);

      await poiController.getPOI(req, res, next);

      assert.equal(cacheService.ensureFreshType.mock.calls.length, 1);
      assert.deepEqual(cacheService.ensureFreshType.mock.calls[0].arguments, ['composteurs']);
      assert.equal(res.status.mock.calls[0].arguments[0], 200);
      assert.deepEqual(res.json.mock.calls[0].arguments[0], mockResult.items);
    });

    test("devrait renvoyer tous les POI si aucun type n' est précisé", async () => {
      const mockItems = [{ id: 1 }, { id: 2 }];
      mock.method(cacheService, 'getAllCachedPoi', async () => mockItems);

      await poiController.getPOI(req, res, next);

      assert.equal(cacheService.getAllCachedPoi.mock.calls.length, 1);
      assert.equal(res.status.mock.calls[0].arguments[0], 200);
      assert.deepEqual(res.json.mock.calls[0].arguments[0], mockItems);
    });

    test('devrait appeler next(error) en cas de crash', async () => {
      const error = new Error('Erreur base de données');
      mock.method(cacheService, 'getAllCachedPoi', async () => { throw error; });

      await poiController.getPOI(req, res, next);

      assert.equal(next.mock.calls.length, 1);
      assert.equal(next.mock.calls[0].arguments[0], error);
    });
  });

  describe('getCacheInfo', () => {
    test('devrait renvoyer les informations du cache pour un type', async () => {
      req.params.type = 'composteurs';
      const mockInfo = { state: 'CACHE_HIT', type: 'composteurs' };
      mock.method(cacheService, 'inspectCache', async () => mockInfo);

      await poiController.getCacheInfo(req, res, next);

      assert.equal(cacheService.inspectCache.mock.calls.length, 1);
      assert.equal(res.status.mock.calls[0].arguments[0], 200);
      assert.deepEqual(res.json.mock.calls[0].arguments[0], mockInfo);
    });
  });
});