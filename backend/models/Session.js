import mongoose from 'mongoose';

const pasteEventSchema = new mongoose.Schema({
  timestamp: Number,
  pastedLength: Number,
  cursorPosition: Number,
  timeSinceLastKeystroke: Number,
  pasteIndex: Number
});

const keystrokeEventSchema = new mongoose.Schema({
  keydownTime: Number,
  keyupTime: Number,
  holdTime: Number,
  interKeyTime: Number
});

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  totalTypedChars: {
    type: Number,
    default: 0
  },
  totalPastedChars: {
    type: Number,
    default: 0
  },
  pasteRatio: {
    type: Number,
    default: 0
  },
  pasteEvents: [pasteEventSchema],
  keystrokeEvents: [keystrokeEventSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Session', sessionSchema);
