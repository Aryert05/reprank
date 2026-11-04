import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_ACCOUNTS as backendAccounts } from '../config/demoAccounts.js';
import { DEMO_ACCOUNTS as frontendAccounts } from '../../src/data/demoAccounts.js';

test('frontend and backend demo-account definitions stay in sync', () => {
  assert.deepEqual(frontendAccounts, backendAccounts);
});

test('demo accounts use supported roles and local-only email domains', () => {
  for (const account of backendAccounts) {
    assert.ok(['user', 'admin'].includes(account.role));
    assert.match(account.email, /@reprank\.local$/);
    assert.ok(account.password.length >= 6);
  }
});
