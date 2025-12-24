const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, full_name: user.full_name, },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
};

module.exports = generateToken;
