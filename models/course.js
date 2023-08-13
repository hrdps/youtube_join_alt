import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter course title.'],
    minLength: [6, 'Title should be at least 6 characters.'],
    maxLength: [80, 'Title cannot excess 80 characters.'],
  },
  description: {
    type: String,
    required: [true, 'Please enter description.'],
    minLength: [6, 'Course description should be at least 6 characters.'],
  },
  lectures: [
    {
      title: { type: String, required: [true, 'Please enter lecture title'] },
      description: {
        type: String,
        required: [true, 'Please enter lecture description'],
      },
      video: {
        public_id: {
          type: String,
          reqiured: true,
        },
        url: {
          type: String,
          reqiured: true,
        },
      },
    },
  ],
  poster: {
    public_id: {
      type: String,
      reqiured: true,
    },
    url: {
      type: String,
      reqiured: true,
    },
  },
  views: {
    type: Number,
    default: 0,
  },
  numOfVideos: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: [true, 'Please enter the creator name'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Course = mongoose.model('Course', schema);
