const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google authentication endpoint
router.post('/google', async (req, res) => {
    try {
        console.log('Received Google auth request');
        const { token } = req.body;
        
        if (!token) {
            console.error('No token provided');
            return res.status(400).json({ error: 'No token provided' });
        }

        console.log('Verifying Google token...');
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        console.log('Token verified, payload:', payload);
        
        const { sub: googleId, name, email } = payload;

        // Find or create user
        let user = await User.findOne({ googleId });
        if (!user) {
            console.log('Creating new user:', { googleId, name, email });
            user = await User.create({
                googleId,
                name,
                email,
                score: 0
            });
        } else {
            console.log('Found existing user:', user);
        }

        // Generate JWT token
        const jwtToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('Login successful, sending response');
        res.json({ user, token: jwtToken });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Authentication failed', details: error.message });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router; 