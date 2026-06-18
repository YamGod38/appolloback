const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                console.warn('[AuthMiddleware] Token missing or invalid format:', authHeader);
                return res.status(401).json({ error: 'Unauthorized. Token missing or invalid format.' });
            }

            const token = authHeader.split(' ')[1];
            if (token === 'null' || !token) {
                console.warn('[AuthMiddleware] Token is literally "null" string');
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const decoded = jwt.verify(token, JWT_SECRET);

            // If specific roles are required, check them
            if (roles.length > 0 && !roles.includes(decoded.role)) {
                console.warn('[AuthMiddleware] Insufficient permissions for role:', decoded.role);
                return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
            }

            req.user = decoded;
            next();
        } catch (error) {
            console.error('[AuthMiddleware] JWT Verification Failed:', error.message);
            return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
        }
    };
};

module.exports = authMiddleware;
