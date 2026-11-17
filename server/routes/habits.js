const express = require('express');
const auth = require('../middleware/auth');
const {
  clearHabitLog,
  createHabit,
  deleteHabit,
  listHabits,
  setHabitLog,
  updateHabit,
} = require('../controllers/habitController');

const router = express.Router();

router.use(auth);
router.get('/', listHabits);
router.post('/', createHabit);
router.patch('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.put('/:id/logs/:date', setHabitLog);
router.delete('/:id/logs/:date', clearHabitLog);

module.exports = router;
