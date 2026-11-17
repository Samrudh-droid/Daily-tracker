const mongoose = require('mongoose');
const { isValidDateString } = require('../utils/date');

const habitLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    habit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
    },
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
      enum: ['done', 'missed'],
      required: true,
    },
  },
  { timestamps: true }
);

habitLogSchema.index({ habit: 1, date: 1 }, { unique: true });
habitLogSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('HabitLog', habitLogSchema);
