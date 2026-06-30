const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getAuthFailureResponse = (message, reason) => {
    const response = { message };
    if (process.env.NODE_ENV !== 'production' && reason) {
        response.reason = reason;
    }
    return response;
};

const protect = async (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    if (!process.env.JWT_SECRET) {
        return res
            .status(500)
            .json(getAuthFailureResponse('Authentication is not configured', 'missing_jwt_secret'));
    }

    try {
        const decoded = jwt.verify(token.trim(), process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res
                .status(401)
                .json(getAuthFailureResponse('Not authorized, user not found', 'user_not_found'));
        }

        req.user = user;
        return next();
    } catch (error) {
        return res
            .status(401)
            .json(getAuthFailureResponse('Not authorized, token failed', error.name));
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, no user context' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role ${req.user.role} is not authorized to access this route` });
        }
        next();
    };
};

module.exports = { protect, authorize };
