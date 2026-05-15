const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { HrUser } = require('../models');
const { getJwtSecret } = require('../lib/jwtSecret');
const { requireHr } = require('../middleware/requireHr');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await HrUser.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(String(password), user.passwordHash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { sub: user._id.toString(), email: user.email },
            getJwtSecret(),
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        console.error('LOGIN ERROR:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post('/logout', (_req, res) => {
    res.status(204).send();
});

router.get('/me', requireHr, (req, res) => {
    const u = req.hrUser;
    res.json({
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        role: u.role
    });
});

module.exports = router;