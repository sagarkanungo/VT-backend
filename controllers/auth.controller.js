const bcrypt = require('bcrypt');
const db = require('../config/db');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res) => {
    try {
        const { full_name, phone, password, confirm_password } = req.body;

        if (!full_name || !phone || !password || !confirm_password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const idDocPath = req.file ? req.file.path : null;

        db.query(
            'INSERT INTO users (full_name, phone, password, id_document) VALUES (?, ?, ?, ?)',
            [full_name, phone, hashedPassword, idDocPath],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: 'User registered successfully' });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    db.query('SELECT * FROM users WHERE phone = ?', [phone], async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(400).json({ error: 'User not found' });

        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                phone: user.phone,
                role: user.role
            }
        });
    });
};
