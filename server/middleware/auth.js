function requireAuth(req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }
    next();
}

function requireManager(req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }

    if (!req.user.is_manager) {
        return res.status(403).json({
            error: 'Manager access required'
        });
    }

    next();
}

module.exports = {
    requireAuth,
    requireManager
};