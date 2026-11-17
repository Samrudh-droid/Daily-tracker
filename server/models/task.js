const mongoose = require('mongoose');
const { isValidDateString } = require('../utils/date');

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    date: {
      type: String,
      required: true,
      validate: {
        validator: isValidDateString,
        message: 'Date must be a valid YYYY-MM-DD calendar date',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'done', 'missed', 'cancelled'],
      default: 'pending',
      required: true,
    },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Task', taskSchema);
