import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DATABASE_UNAVAILABLE_CODE,
  isDatabaseReady,
  isDatabaseUnavailableError,
  requireDatabase,
} from '../middleware/databaseMiddleware.js';

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('isDatabaseReady only accepts Mongoose readyState 1', () => {
  assert.equal(isDatabaseReady({ readyState: 1 }), true);
  assert.equal(isDatabaseReady({ readyState: 0 }), false);
  assert.equal(isDatabaseReady({ readyState: 2 }), false);
  assert.equal(isDatabaseReady(null), false);
});

test('requireDatabase calls next when the connection is ready', () => {
  const req = { app: { locals: { mongooseConnection: { readyState: 1 } } } };
  const res = mockResponse();
  let nextCalled = false;

  requireDatabase(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, null);
});

test('requireDatabase returns a safe 503 when the database is unavailable', () => {
  const req = { app: { locals: { mongooseConnection: { readyState: 0 } } } };
  const res = mockResponse();
  let nextCalled = false;

  requireDatabase(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, DATABASE_UNAVAILABLE_CODE);
  assert.match(res.body.message, /database is not connected/i);
  assert.equal('stack' in res.body, false);
});

test('database connection errors are recognised without exposing details', () => {
  assert.equal(isDatabaseUnavailableError({ name: 'MongooseServerSelectionError' }), true);
  assert.equal(isDatabaseUnavailableError({ name: 'MongoNetworkError' }), true);
  assert.equal(
    isDatabaseUnavailableError({
      name: 'MongooseError',
      message: 'Operation `users.findOne()` buffering timed out after 10000ms',
    }),
    true,
  );
  assert.equal(isDatabaseUnavailableError({ name: 'ValidationError' }), false);
  assert.equal(isDatabaseUnavailableError(null), false);
});
