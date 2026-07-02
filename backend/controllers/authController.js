const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' }); // 15 minutes
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }); // 7 days
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'user'
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateAccessToken(user._id),
                refreshToken: generateRefreshToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // First check the User collection
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateAccessToken(user._id),
                refreshToken: generateRefreshToken(user._id)
            });
        }

        // If not found in User, check the Staff collection
        const Staff = require('../models/Staff');
        const staff = await Staff.findOne({ email: email.toLowerCase() });

        if (staff && (await staff.matchPassword(password))) {
            // Check if staff is active
            if (staff.status !== 'active') {
                return res.status(401).json({ message: 'Your account is inactive. Contact admin.' });
            }
            return res.json({
                _id: staff._id,
                name: staff.fullName,
                email: staff.email,
                role: staff.role,
                isStaff: true,
                token: generateAccessToken(staff._id),
                refreshToken: generateRefreshToken(staff._id)
            });
        }

        res.status(401).json({ message: 'Invalid email or password' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get new access token from refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
    const { token } = req.body || {};

    if (!token) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const accessToken = generateAccessToken(decoded.id);
        res.json({ token: accessToken });
    } catch (error) {
        res.status(403).json({ message: 'Invalid refresh token' });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body || {};

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a simple reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // In a real application, send this token via email
        // Mocking the email sending for now
        res.status(200).json({ 
            message: 'Email sent (Mocked)', 
            resetToken: resetToken // Returning token for demonstration purposes
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, refreshToken, forgotPassword };
