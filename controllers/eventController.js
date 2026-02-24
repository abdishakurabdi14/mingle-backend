// controllers/eventController.js
const Event = require('../models/Event');

// Helper to get userId from req.user (supports _id or id)
const getUserIdFromReq = (req) => {
  if (!req.user) return null;
  return req.user._id || req.user.id;
};

// Helper: update status if expired
const updateStatusIfExpired = async (event) => {
  const now = new Date();
  if (event.status === 'Live' && event.expiresAt && event.expiresAt <= now) {
    event.status = 'Expired';
    await event.save();
  }
  return event;
};

// Calculate "activity" score for most-active endpoint
const getActivityScore = (event) => {
  const likes = event.likes ? event.likes.length : 0;
  const dislikes = event.dislikes ? event.dislikes.length : 0;
  const comments = event.comments ? event.comments.length : 0;
  return likes + dislikes + comments;
};

// POST /api/events
// Create a new Mingle post
const createEvent = async (req, res) => {
  const { title, body, topics, expiresAt, location, capacity } = req.body;

  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorised' });
    }

    if (!title || !body || !topics || !expiresAt) {
      return res.status(400).json({
        message: 'Title, body, topics and expiresAt are required',
      });
    }

    // Allow passing a single topic or an array
    const topicsArray = Array.isArray(topics) ? topics : [topics];

    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime())) {
      return res.status(400).json({ message: 'Invalid expiresAt date' });
    }

    const now = new Date();
    if (expiryDate <= now) {
      return res
        .status(400)
        .json({ message: 'expiresAt must be in the future' });
    }

    const event = await Event.create({
      title,
      body,
      topics: topicsArray,
      expiresAt: expiryDate,
      location,
      capacity,
      createdBy: userId,
    });

    res.status(201).json({
      message: 'Event (Mingle post) created successfully',
      event,
    });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ message: 'Server error while creating event' });
  }
};

// GET /api/events

const getEvents = async (req, res) => {
  try {
    const now = new Date();
    const filter = {
      expiresAt: { $gt: now }, // live-by-time
    };

    if (req.query.topic) {
      filter.topics = req.query.topic;
    }

    let events = await Event.find(filter)
      .populate('createdBy', 'name email')
      .populate('likes', 'name email')
      .populate('dislikes', 'name email')
      .populate('comments.user', 'name email')
      .sort({ createdAt: -1 });

    // Ensure status correct in DB for those that expired while stored
    events = await Promise.all(events.map(updateStatusIfExpired));

    res.json(events);
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
};

// GET /api/events/expired
// List EXPIRED posts
const getExpiredEvents = async (req, res) => {
  try {
    const now = new Date();
    const filter = {
      expiresAt: { $lte: now },
    };

    if (req.query.topic) {
      filter.topics = req.query.topic;
    }

    let events = await Event.find(filter)
      .populate('createdBy', 'name email')
      .populate('likes', 'name email')
      .populate('dislikes', 'name email')
      .populate('comments.user', 'name email')
      .sort({ expiresAt: -1 });

    events = await Promise.all(events.map(updateStatusIfExpired));

    res.json(events);
  } catch (err) {
    console.error('Get expired events error:', err);
    res.status(500).json({ message: 'Server error while fetching expired events' });
  }
};

// GET /api/events/:id
const getEventById = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('likes', 'name email')
      .populate('dislikes', 'name email')
      .populate('comments.user', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event = await updateStatusIfExpired(event);

    res.json(event);
  } catch (err) {
    console.error('Get event by id error:', err);
    res.status(500).json({ message: 'Server error while fetching event' });
  }
};

// PUT /api/events/:id
const updateEvent = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorised' });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only creator can update
    if (event.createdBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to update this event' });
    }

    // Cannot update expired event
    const now = new Date();
    if (event.expiresAt && event.expiresAt <= now) {
      return res
        .status(400)
        .json({ message: 'Cannot update an expired event' });
    }

    const fields = ['title', 'body', 'topics', 'expiresAt', 'location', 'capacity'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    if (req.body.expiresAt) {
      const expiryDate = new Date(req.body.expiresAt);
      if (isNaN(expiryDate.getTime())) {
        return res.status(400).json({ message: 'Invalid expiresAt date' });
      }
      event.expiresAt = expiryDate;
    }

    const updated = await event.save();
    res.json({ message: 'Event updated successfully', event: updated });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ message: 'Server error while updating event' });
  }
};

// DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorised' });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only creator can delete
    if (event.createdBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ message: 'Server error while deleting event' });
  }
};

// POST /api/events/:id/like
const likeEvent = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorised' });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const now = new Date();
    if (event.expiresAt && event.expiresAt <= now) {
      return res
        .status(400)
        .json({ message: 'Cannot like an expired event' });
    }

    if (event.createdBy.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ message: 'Creators cannot like their own posts' });
    }

    const liked = event.likes.some(
      (id) => id.toString() === userId.toString()
    );
    if (liked) {
      return res.status(400).json({ message: 'You already liked this post' });
    }

    // Remove from dislikes if present
    event.dislikes = event.dislikes.filter(
      (id) => id.toString() !== userId.toString()
    );

    event.likes.push(userId);
    await event.save();

    res.json({ message: 'Post liked', event });
  } catch (err) {
    console.error('Like event error:', err);
    res.status(500).json({ message: 'Server error while liking event' });
  }
};

// POST /api/events/:id/dislike
const dislikeEvent = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorised' });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const now = new Date();
    if (event.expiresAt && event.expiresAt <= now) {
      return res
        .status(400)
        .json({ message: 'Cannot dislike an expired event' });
    }

    if (event.createdBy.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ message: 'Creators cannot dislike their own posts' });
    }

    const disliked = event.dislikes.some(
      (id) => id.toString() === userId.toString()
    );
    if (disliked) {
      return res
        .status(400)
        .json({ message: 'You already disliked this post' });
    }

    // Remove from likes if present
    event.likes = event.likes.filter(
      (id) => id.toString() !== userId.toString()
    );

    event.dislikes.push(userId);
    await event.save();

    res.json({ message: 'Post disliked', event });
  } catch (err) {
    console.error('Dislike event error:', err);
    res.status(500).json({ message: 'Server error while disliking event' });
  }
};

// POST /api/events/:id/comment
const commentOnEvent = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorised' });
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const now = new Date();
    if (event.expiresAt && event.expiresAt <= now) {
      return res
        .status(400)
        .json({ message: 'Cannot comment on an expired event' });
    }

    event.comments.push({
      user: userId,
      text: text.trim(),
    });

    await event.save();

    res.json({ message: 'Comment added', event });
  } catch (err) {
    console.error('Comment event error:', err);
    res.status(500).json({ message: 'Server error while commenting on event' });
  }
};

// GET /api/events/most-active?topic=Tech
const getMostActiveEvent = async (req, res) => {
  try {
    const { topic } = req.query;

    if (!topic) {
      return res
        .status(400)
        .json({ message: 'topic query parameter is required' });
    }

    const now = new Date();

    const events = await Event.find({
      topics: topic,
      expiresAt: { $gt: now }, // only live posts
    })
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    if (!events.length) {
      return res
        .status(404)
        .json({ message: 'No events found for this topic' });
    }

    let mostActive = events[0];
    let bestScore = getActivityScore(events[0]);

    for (let i = 1; i < events.length; i++) {
      const score = getActivityScore(events[i]);
      if (score > bestScore) {
        bestScore = score;
        mostActive = events[i];
      }
    }

    res.json({
      topic,
      activityScore: bestScore,
      event: mostActive,
    });
  } catch (err) {
    console.error('Get most active event error:', err);
    res.status(500).json({ message: 'Server error while fetching most active event' });
  }
};



const attendEvent = async (req, res) => {
try {
const event = await Event.findById(req.params.id);

if (!event) {
return res.status(404).json({ message: 'Event not found' });
}

const attendees = event.attendees || [];

const alreadyAttending = attendees.some(
(attendeeId) => attendeeId.toString() === req.user.id.toString()
);

if (alreadyAttending) {
return res.status(400).json({ message: 'You are already attending this event' });
}

if (event.capacity && attendees.length >= event.capacity) {
return res.status(400).json({ message: 'Event is full' });
}

event.attendees = attendees;
event.attendees.push(req.user.id);

await event.save();

res.json({ message: 'You are now attending this event', event });
} catch (err) {
console.error('Attend event error:', err.message);
res.status(500).json({ message: 'Server error while attending event' });
}
};

module.exports = {
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
};

