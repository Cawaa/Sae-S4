import { test, describe, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import cacheService from '../../api/services/cacheService.mjs';
import poiDao from '../../api/dao/poiDao.mjs';
import fetcherDao from '../../api/dao/fetcherDao.mjs';

describe('cacheService', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  describe('inspectCache', () => {
    test('devrait jeter une erreur 400 si le type est inconnu', async () => {
      try {
        await cacheService.inspectCache('avions');
        assert.fail('Aurait dû jeter une erreur');
      } catch (error) {
        assert.equal(error.status, 400);
        assert.equal(error.code, 'UNKNOWN_TYPE');
      }
    });

    test('devrait retourner CACHE_MISS si la donnée n\'existe pas', async () => {
      mock.method(poiDao, 'findByType', async () => null);
      const result = await cacheService.inspectCache('composteurs');
      assert.equal(result.state, 'CACHE_MISS');
    });

    test('devrait retourner CACHE_EXPIRED si la donnée est périmée', async () => {
      const pastDate = new Date(Date.now() - 10000); // 10 secondes avant
      mock.method(poiDao, 'findByType', async () => ({ expiresAt: pastDate }));
      
      const result = await cacheService.inspectCache('composteurs');
      assert.equal(result.state, 'CACHE_EXPIRED');
    });

    test('devrait retourner CACHE_HIT si la donnée est valide', async () => {
      const futureDate = new Date(Date.now() + 10000); // 10 secondes après
      mock.method(poiDao, 'findByType', async () => ({ expiresAt: futureDate }));
      
      const result = await cacheService.inspectCache('composteurs');
      assert.equal(result.state, 'CACHE_HIT');
    });
  });

  describe('ensureFreshType', () => {
    test('devrait renvoyer les données du cache directement si valide (CACHE_HIT)', async () => {
      const futureDate = new Date(Date.now() + 10000);
      const mockCache = { expiresAt: futureDate, items: [{ id: 1 }] };
      
      mock.method(poiDao, 'findByType', async () => mockCache);
      mock.method(fetcherDao, 'fetchDataset', async () => assert.fail('Ne devrait pas fetcher'));

      const result = await cacheService.ensureFreshType('composteurs');
      
      assert.equal(result.state, 'RESPONSE_READY');
      assert.deepEqual(result.items, mockCache.items);
      assert.ok(result.stateTrace.includes('CACHE_HIT'));
    });

    test('devrait fetcher de nouvelles données si CACHE_MISS', async () => {
      mock.method(poiDao, 'findByType', async () => null);
      
      // On simule le retour de l'API
      const mockFetched = { items: [{ id: 2 }] };
      mock.method(fetcherDao, 'fetchDataset', async () => mockFetched);
      
      // On simule la sauvegarde
      mock.method(poiDao, 'upsertTypeData', async (t, items, meta) => ({
        fetchedAt: meta.fetchedAt,
        expiresAt: meta.expiresAt,
        itemCount: items.length
      }));

      const result = await cacheService.ensureFreshType('composteurs');
      
      assert.equal(fetcherDao.fetchDataset.mock.calls.length, 1);
      assert.equal(poiDao.upsertTypeData.mock.calls.length, 1);
      assert.deepEqual(result.items, mockFetched.items);
      assert.ok(result.stateTrace.includes('CACHE_MISS'));
      assert.ok(result.stateTrace.includes('FETCHER_REQUESTED'));
    });
  });
});