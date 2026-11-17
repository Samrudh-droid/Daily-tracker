const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maximumPasswordBytes = 72;

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

function validateCredentials({ name, email, password }, includeName) {
  if (includeName && (typeof name !== 'string' || !name.trim())) {
    return 'Name is required';
  }
  if (includeName && name.trim().length > 80) {
    return 'Name must be 80 characters or fewer';
  }
  if (typeof email !== 'string' || !emailPattern.test(email.trim())) {
    return 'A valid email is required';
  }
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (Buffer.byteLength(password, 'utf8') > maximumPasswordBytes) {
    return 'Password must be 72 bytes or fewer';
  }

  return null;
}

async function signup(req, res) {
  const { name, email, password } = req.body || {};
  const validationMessage = validateCredentials(
    { name, email, password },
    true
  );
  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
  });

  return res.status(201).json({
    token: createToken(user._id),
    user: publicUser(user),
  });
}

async function login(req, res) {
  const { email, password } = req.body || {};
  const validationMessage = validateCredentials(
    { email, password },
    false
  );
  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  const passwordMatches =
    user && (await bcrypt.compare(password, user.passwordHash));

  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json({
    token: createToken(user._id),
    user: publicUser(user),
  });
}

async function getCurrentUser(req, res) {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: publicUser(user) });
}

module.exports = { signup, login, getCurrentUser };
