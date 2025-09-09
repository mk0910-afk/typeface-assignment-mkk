const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { _blacklistedJtis } = require('../controllers/authController');

exports.protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;
    if (!token) return res.status(401).json({ message: "Unauthorized, no token exists" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.jti && _blacklistedJtis.has(decoded.jti)) {
            return res.status(401).json({ message: "Unauthorized, token revoked!" });
        }
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (err) {
        res.status(401).json({ message: "Unauthorized, token failed!" });
    } 
};