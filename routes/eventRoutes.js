// routes/eventRoutes.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/authMiddleware');
const {
  createEvent,
  getEvents,
  getExpiredEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  likeEvent,
  dislikeEvent,
  commentOnEvent,
  getMostActiveEvent,
  attendEvent,
} = require('../controllers/eventController');

// NOTE: Order matters – more specific routes before '/:id'

// Create a new post
router.post('/', auth, createEvent);

// List LIVE posts (optionally ?topic=Health)
router.get('/', auth, getEvents);

// List EXPIRED posts (optionally ?topic=Health)
router.get('/expired', auth, getExpiredEvents);

// Get the most active post for a topic
router.get('/most-active', auth, getMostActiveEvent);

// Get a single post by id
router.get('/:id', auth, getEventById);

// Update / delete
router.put('/:id', auth, updateEvent);
router.delete('/:id', auth, deleteEvent);

// Like / dislike / comment
router.post('/:id/like', auth, likeEvent);
router.post('/:id/dislike', auth, dislikeEvent);
router.post('/:id/comment', auth, commentOnEvent);

// Optional: keep attend feature
router.post('/:id/attend', auth, attendEvent);

module.exports = router;


