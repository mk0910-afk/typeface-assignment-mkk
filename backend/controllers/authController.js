const User = require("../models/User")
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');

// Generate JWT token
const generateToken = (id) => {
    const jti = uuidv4();
    return jwt.sign({ id, jti }, process.env.JWT_SECRET, { expiresIn: "1h"});
}

// In-memory blacklist; replace with Redis in production
const blacklistedJtis = new Set();
exports._blacklistedJtis = blacklistedJtis;

// Register user
exports.registerUser = async (req, res) => {
    const { firstName, lastName, email, phone, password, profileImageUrl } = req.body;

    // Validation: Check if all fields are provided
    if (!firstName || !lastName || !email || !phone || !password) {
        return res.status(400).json({ message: "Please fill all fields" });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if ( existingUser ) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create new user
        const user = await User.create({
            firstName, lastName,
            email, phone,
            password, 
            profileImageUrl,
        });

        const token = generateToken(user._id);
        res
            .cookie('token', token, {
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
                maxAge: 60 * 60 * 1000,
            })
            .status(201)
            .json({
                id: user._id,
                user,
                token,
            });
    } catch (err) {
        res
          .status(500)
          .json({ message: "Error while registering user", error: err.message });
    }
};

// Login user
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Please fill all fields" });
    }
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user._id);
        res
            .cookie('token', token, {
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
                maxAge: 60 * 60 * 1000,
            })
            .status(200)
            .json({
                id: user._id,
                user,
                token,
            });
    } catch (err) {
        res
          .status(500)
          .json({ message: "Error while registering user", error: err.message });
    }
};

// Register user
exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (err) {
        res
          .status(500)
          .json({ message: "Error while registering user", error: err.message });
    }
};

// Logout user (JWT is stateless; client should delete token)
// Logout user (revoke current token and clear cookie)
exports.logoutUser = async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const tokenFromHeader = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;
      const token = tokenFromHeader || req.cookies?.token || null;
  
      // Try to get jti even if token is expired
      let jti = null;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          jti = decoded?.jti || null;
        } catch (_) {
          const decoded = jwt.decode(token);
          jti = decoded?.jti || null;
        }
        if (jti) blacklistedJtis.add(jti);
      }
  
      // Clear the cookie with the SAME options used when setting it
      const cookieOpts = {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/', // ensure path matches default
      };
  
      // Clear cookie (do both for stubborn browsers)
      res.clearCookie('token', cookieOpts);
      res.cookie('token', '', { ...cookieOpts, maxAge: 0 });
  
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      return res.status(500).json({ message: 'Error during logout' });
    }
  };
  