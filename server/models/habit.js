const mongoose = require('mongoose');
const { isValidDateString } = require('../utils/date');

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    createdDate: {
      type: String,
      required: true,
      validate: {
        validator: isValidDateString,
        message: 'Created date must be a valid YYYY-MM-DD calendar date',
      },
    },
  },
  { timestamps: true }
);

habitSchema.index({ user: 1, createdDate: 1 });

module.exports = mongoose.model('Habit', habitSchema);
