import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.FETCHER_URL = 'http://localhost:8888';

// On importe le module APRES avoir modifié process.env
const { default: fetcherDao } = await import('../../api/dao/fetcherDao.mjs');

describe('fetcherDao', () => {
  let testServer;
  let serverResponseCode = 200;
  let serverResponseBody = {};

  before(async () => {
    // Création d'un serveur temporaire sur le port 8888
    testServer = http.createServer((req, res) => {
      res.writeHead(serverResponseCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(serverResponseBody));
    });
    await new Promise(resolve => testServer.listen(8888, resolve));
  });

  after(() => {
    testServer.close();
  });

  test('devrait retourner les données si le fetcher répond 200', async () => {
    serverResponseCode = 200;
    serverResponseBody = { items: [{ id: 1 }] };

    const data = await fetcherDao.fetchDataset('composteurs');
    assert.deepEqual(data.items, [{ id: 1 }]);
  });

  test('devrait lever une erreur FETCHER_BAD_RESPONSE si le fetcher répond 500', async () => {
    serverResponseCode = 500;
    serverResponseBody = { message: 'Internal Server Error' };

    try {
      await fetcherDao.fetchDataset('composteurs');
      assert.fail('Aurait dû jeter une erreur');
    } catch (error) {
      assert.equal(error.status, 502);
      assert.equal(error.code, 'FETCHER_BAD_RESPONSE');
    }
  });

  test('devrait lever une erreur FETCHER_UNAVAILABLE si le fetcher est éteint (ECONNREFUSED)', async () => {
    // On ferme le serveur
    testServer.close();

    try {
      await fetcherDao.fetchDataset('composteurs');
      assert.fail('Aurait dû jeter une erreur');
    } catch (error) {
      assert.equal(error.status, 503);
      assert.equal(error.code, 'FETCHER_UNAVAILABLE');
    }
  });
});