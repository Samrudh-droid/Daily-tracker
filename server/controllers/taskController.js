const mongoose = require('mongoose');
const Task = require('../models/task');
const { isValidDateString } = require('../utils/date');

const taskStatuses = ['pending', 'done', 'missed', 'cancelled'];
const maximumTitleLength = 200;

function isRequestObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyFields(value, allowedFields) {
  return Object.keys(value).every((field) => allowedFields.includes(field));
}

function serializeTask(task) {
  return {
    id: String(task._id),
    title: task.title,
    date: task.date,
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

async function listTasks(req, res) {
  const { date } = req.query;
  if (!isValidDateString(date)) {
    return res
      .status(400)
      .json({ message: 'A valid date query in YYYY-MM-DD format is required' });
  }

  const tasks = await Task.find({ user: req.userId, date }).sort({
    createdAt: 1,
  });
  return res.json({ tasks: tasks.map(serializeTask) });
}

async function createTask(req, res) {
  const body = req.body;
  if (!isRequestObject(body) || !hasOnlyFields(body, ['title', 'date'])) {
    return res
      .status(400)
      .json({ message: 'Request must include only title and date' });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > maximumTitleLength) {
    return res.status(400).json({
      message: `Title must be between 1 and ${maximumTitleLength} characters`,
    });
  }
  if (!isValidDateString(body.date)) {
    return res
      .status(400)
      .json({ message: 'Date must be a valid YYYY-MM-DD calendar date' });
  }

  const task = await Task.create({
    user: req.userId,
    title,
    date: body.date,
  });
  return res.status(201).json({ task: serializeTask(task) });
}

async function updateTask(req, res) {
  const body = req.body;
  const allowedFields = ['title', 'status'];
  if (
    !isRequestObject(body) ||
    !hasOnlyFields(body, allowedFields) ||
    Object.keys(body).length === 0
  ) {
    return res
      .status(400)
      .json({ message: 'Request must include title or status only' });
  }

  const updates = {};
  if (Object.hasOwn(body, 'title')) {
    if (typeof body.title !== 'string') {
      return res.status(400).json({ message: 'Title must be a string' });
    }

    updates.title = body.title.trim();
    if (!updates.title || updates.title.length > maximumTitleLength) {
      return res.status(400).json({
        message: `Title must be between 1 and ${maximumTitleLength} characters`,
      });
    }
  }

  if (Object.hasOwn(body, 'status')) {
    if (!taskStatuses.includes(body.status)) {
      return res.status(400).json({
        message: `Status must be one of: ${taskStatuses.join(', ')}`,
      });
    }
    updates.status = body.status;
  }

  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: 'Invalid task id' });
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  return res.json({ task: serializeTask(task) });
}

async function deleteTask(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: 'Invalid task id' });
  }

  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    user: req.userId,
  });
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  return res.json({ message: 'Task deleted' });
}

module.exports = { listTasks, createTask, updateTask, deleteTask };
