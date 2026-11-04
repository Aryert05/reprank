export const requireAdminCreationSecret = (req, res, next) => {
  const providedSecret = req.headers['x-admin-secret'];
  const configuredSecret = process.env.ADMIN_CREATION_SECRET;

  if (!configuredSecret || !providedSecret || providedSecret !== configuredSecret) {
    return res.status(403).json({ message: 'Forbidden: Invalid admin secret' });
  }

  next();
};
