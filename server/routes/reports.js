const express = require('express');
const auth = require('../middleware/auth');
const {
  getMonthlyReport,
  getWeeklyReport,
} = require('../controllers/reportController');

const router = express.Router();

router.use(auth);
router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);

module.exports = router;
