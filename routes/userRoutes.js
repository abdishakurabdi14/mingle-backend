// routes/userRoutes.js
const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private
router.get('/me', authMiddleware, getMe);

module.exports = router;

