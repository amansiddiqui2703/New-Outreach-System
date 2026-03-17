/**
 * Middleware to restrict route access based on user role.
 * Must be used AFTER the `auth` middleware.
 * 
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'manager')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Not authenticated or user role not found' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Forbidden: This action requires one of the following roles: ${roles.join(', ')}` });
        }

        next();
    };
};

export default authorize;
