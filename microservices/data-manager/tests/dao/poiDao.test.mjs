import { test, describe, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import poiDao from '../../api/dao/poiDao.mjs';
import POICacheModel from '../../api/model/poiModel.mjs';

describe('poiDao', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  test('findByType devrait appeler findOne avec le bon type et lean()', async () => {
    const mockData = { type: 'composteurs', items: [] };
    // Simulation chaîne Mongoose : findOne().lean()
    const leanMock = mock.fn(async () => mockData);
    mock.method(POICacheModel, 'findOne', () => ({ lean: leanMock }));

    const result = await poiDao.findByType('composteurs');

    assert.equal(POICacheModel.findOne.mock.calls[0].arguments[0].type, 'composteurs');
    assert.equal(leanMock.mock.calls.length, 1);
    assert.deepEqual(result, mockData);
  });

  test('findAll devrait appeler find({}) et lean()', async () => {
    const leanMock = mock.fn(async () => []);
    mock.method(POICacheModel, 'find', () => ({ lean: leanMock }));

    await poiDao.findAll();

    assert.deepEqual(POICacheModel.find.mock.calls[0].arguments[0], {});
    assert.equal(leanMock.mock.calls.length, 1);
  });

  test('upsertTypeData devrait utiliser findOneAndUpdate avec upsert:true', async () => {
    const mockSaved = { type: 'composteurs', items: ['item1'], itemCount: 1 };
    const leanMock = mock.fn(async () => mockSaved);
    mock.method(POICacheModel, 'findOneAndUpdate', () => ({ lean: leanMock }));

    const items = ['item1'];
    const metadata = { source: 'test', fetchedAt: new Date(), expiresAt: new Date() };

    const result = await poiDao.upsertTypeData('composteurs', items, metadata);

    const callArgs = POICacheModel.findOneAndUpdate.mock.calls[0].arguments;
    assert.equal(callArgs[0].type, 'composteurs'); // Condition de recherche
    assert.equal(callArgs[1].itemCount, 1); // Mise à jour (compte)
    assert.equal(callArgs[1].source, 'test');
    assert.equal(callArgs[2].upsert, true);
    
    assert.deepEqual(result, mockSaved);
  });
});