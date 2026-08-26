import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { canCall, recordSuccess, recordFailure, getStatus, reset } from './circuitBreaker.js';

describe('circuitBreaker', () => {
  // Reset avant chaque test pour isoler les états
  beforeEach(() => {
    reset();
  });

  it('état initial : CLOSED, canCall retourne true', () => {
    assert.equal(canCall(), true);
    const status = getStatus();
    assert.equal(status.state, 'CLOSED');
    assert.equal(status.failures, 0);
  });

  it('recordSuccess reset les échecs', () => {
    recordFailure();
    recordFailure();
    recordSuccess();
    const status = getStatus();
    assert.equal(status.failures, 0);
    assert.equal(status.state, 'CLOSED');
  });

  it('après 5 échecs consécutifs → OPEN', () => {
    for (let i = 0; i < 5; i++) recordFailure();
    assert.equal(canCall(), false);
    const status = getStatus();
    assert.equal(status.state, 'OPEN');
    assert.equal(status.failures, 5);
    assert.equal(status.trips, 1);
  });

  it('après 4 échecs → toujours CLOSED', () => {
    for (let i = 0; i < 4; i++) recordFailure();
    assert.equal(canCall(), true);
    assert.equal(getStatus().state, 'CLOSED');
  });

  it('un succès après des échecs partielles reset le compteur', () => {
    recordFailure();
    recordFailure();
    recordSuccess();
    recordFailure();
    // 1 seul échec après le succès
    assert.equal(getStatus().failures, 1);
    assert.equal(getStatus().state, 'CLOSED');
  });
});
