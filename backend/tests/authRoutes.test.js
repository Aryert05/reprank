import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import userRoutes from '../routes/userRoutes.js';

async function withServer(run) {
  const app = express();
  app.use(express.json());
  app.locals.mongooseConnection = { readyState: 0 };
  app.use('/api/users', userRoutes);

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('login validation rejects missing credentials before touching the database', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'Validation failed');
    assert.ok(Array.isArray(body.errors));
    assert.ok(body.errors.some((error) => error.field === 'email'));
    assert.ok(body.errors.some((error) => error.field === 'password'));
  });
});

test('valid login returns service unavailable while the database is down', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo.member@reprank.local',
        password: 'not-checked-because-database-is-down',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.code, 'DATABASE_UNAVAILABLE');
    assert.match(body.message, /database is not connected/i);
    assert.equal('stack' in body, false);
  });
});

test('profile without a token stays 401 before the database guard', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users/profile`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.match(body.message, /No token provided/i);
  });
});

test('admin registration without a secret stays 403 before the database guard', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users/register-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'No Secret',
        email: 'no-secret@reprank.local',
        password: 'irrelevant',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.match(body.message, /Invalid admin secret/i);
  });
});
