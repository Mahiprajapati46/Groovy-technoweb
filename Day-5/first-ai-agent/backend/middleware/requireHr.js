const jwt = require('jsonwebtoken');
const { HrUser } = require('../models');
const { getJwtSecret } = require('../lib/jwtSecret');

function getBearerToken(req) {
    const h = req.headers.authorization;
    if (!h || typeof h !== 'string') return null;
    const m = /^Bearer\s+(\S+)/i.exec(h.trim());
    return m ? m[1] : null;
}

/**
 * Requires `Authorization: Bearer <jwt>`. Sets `req.hrUser` (lean doc with email, name, role).
 */
async function requireHr(req, res, next) {
    try {
        const token = getBearerToken(req);
        if (!token) {
            return res.status(401).json({ error: 'Authorization Bearer token required' });
        }

        let payload;
        try {
            payload = jwt.verify(token, getJwtSecret());
        } catch {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const userId = payload.sub;
        if (!userId) return res.status(401).json({ error: 'Invalid token' });

        const user = await HrUser.findById(userId).select('email name role');
        if (!user) return res.status(401).json({ error: 'User not found' });

        req.hrUser = user;
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = { requireHr, getBearerToken };
