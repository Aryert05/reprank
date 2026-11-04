import mongoose from 'mongoose';

export const DATABASE_UNAVAILABLE_CODE = 'DATABASE_UNAVAILABLE';
export const DATABASE_UNAVAILABLE_MESSAGE =
  'The service is temporarily unavailable because the database is not connected. Please try again shortly.';

export function isDatabaseReady(connection = mongoose.connection) {
  return connection?.readyState === 1;
}

function connectionFor(req) {
  return req.app?.locals?.mongooseConnection || mongoose.connection;
}

export function requireDatabase(req, res, next) {
  if (isDatabaseReady(connectionFor(req))) {
    return next();
  }

  return res.status(503).json({
    message: DATABASE_UNAVAILABLE_MESSAGE,
    code: DATABASE_UNAVAILABLE_CODE,
  });
}

export function isDatabaseUnavailableError(error) {
  if (!error) return false;

  if (
    error.name === 'MongooseServerSelectionError' ||
    error.name === 'MongoNetworkError' ||
    error.name === 'MongoNotConnectedError'
  ) {
    return true;
  }

  const message = String(error.message || '');
  return (
    /buffering timed out/i.test(message) ||
    /before initial connection/i.test(message) ||
    /client must be connected/i.test(message)
  );
}
