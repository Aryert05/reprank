import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import workoutRoutes from '../routes/workoutRoutes.js';

async function withServer(run) {
  const app = express();
  app.use(express.json());
  app.locals.mongooseConnection = { readyState: 1 };
  app.use('/api/workouts', workoutRoutes);

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('workout routes require authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/workouts`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.match(body.message, /No token provided/i);
  });
});

test('workout routes reject invalid tokens', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/workouts`, {
      headers: { authorization: 'Bearer not-a-valid-token' },
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.match(body.message, /Invalid or expired token/i);
  });
});
