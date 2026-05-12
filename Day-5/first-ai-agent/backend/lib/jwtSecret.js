function getJwtSecret() {
    const s = process.env.JWT_SECRET;
    if (s && String(s).trim()) return String(s).trim();
    console.warn(
        '[auth] JWT_SECRET missing; using insecure dev fallback. Set JWT_SECRET in backend/.env for production.'
    );
    return 'hr_pulse_dev_jwt_secret_change_me';
}

module.exports = { getJwtSecret };
