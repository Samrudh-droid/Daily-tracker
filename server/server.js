require('dotenv').config();
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const connectDatabase = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const habitRoutes = require('./routes/habits');
const reportRoutes = require('./routes/reports');

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  })
);
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Daily Tracker API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/reports', reportRoutes);
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
app.use(errorHandler);

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  await connectDatabase();
  app.listen(port, () => {
    console.log(`Daily Tracker API is listening on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch(() => {
    console.error(
      'Could not start Daily Tracker API. Check its environment configuration and MongoDB connection.'
    );
    process.exitCode = 1;
  });
}

module.exports = app;
