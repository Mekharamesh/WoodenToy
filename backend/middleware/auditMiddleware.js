const auditContextMiddleware = (req, res, next) => {
    req.auditContext = {
        userId: req.user ? req.user._id : null,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
    };
    next();
};

module.exports = { auditContextMiddleware };
