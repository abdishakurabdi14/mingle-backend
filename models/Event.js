// models/Event.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    // Mingle "topics" for this post
    topics: {
      type: [String],
      enum: ['Politics', 'Health', 'Sport', 'Tech'],
      required: [true, 'At least one topic is required'],
    },

    // Body of the Mingle message
    body: {
      type: String,
      required: [true, 'Message body is required'],
      trim: true,
    },

    // When this post stops being Live
    expiresAt: {
      type: Date,
      required: [true, 'Expiration time is required'],
    },

    // Live / Expired flag
    status: {
      type: String,
      enum: ['Live', 'Expired'],
      default: 'Live',
    },

    
    location: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 50,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Likes / dislikes / comments: user references
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [commentSchema],
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;

