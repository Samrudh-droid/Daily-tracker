const express = require('express');
const auth = require('../middleware/auth');
const {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

router.use(auth);
router.get('/', listTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
