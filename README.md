# Daily Tracker

**Live app:** [Daily Tracker](https://daily-tracker-zeta-sage.vercel.app)

Daily Tracker is a personal task and habit tracker built as a MERN stack project
for the Full Stack Development course at VVCE Mysuru. It helps you plan a day,
keep permanent daily habits, and review weekly and monthly progress.

## Features

- Email/password signup and login, protected routes, and a 30-day JWT session
- Date-specific tasks with pending, done, missed, and cancelled states
- Permanent habits with daily done/missed logs, clearing, and streaks
- Weekly and monthly reports calculated by the API
- Responsive React interface, accessible controls, and a persisted dark mode

## Technology

- **Runtime:** Node.js 24
- **API:** Express 5, MongoDB Atlas, Mongoose, bcryptjs, JWT, Helmet, and CORS
- **Web app:** React, Vite, React Router, Axios, Tailwind CSS v4, Recharts,
  lucide-react, react-hot-toast, and date-fns

## Project layout

```text
client/   React pages, components, styles, and Vite configuration
server/
  config/       MongoDB connection
  controllers/  Request handling and report aggregation
  middleware/  JWT authentication and API error responses
  models/       User, task, habit, and habit-log schemas
  routes/       Express API routes
  scripts/      Optional demo-data script
  utils/        Calendar-date, streak, and report helpers
docs/     API request examples
```

## Run locally

1. Install Node.js 24 and create a MongoDB Atlas database (or use a local
   MongoDB instance).
2. Copy `server/.env.example` to `server/.env` only if you do not already have
   your own `server/.env`. Set `MONGO_URI` and a private, randomly generated
   `JWT_SECRET`. Do not commit environment files.
3. Install both projects from the repository root:

   ```sh
   npm run install:all
   ```

4. Start the API and web app together:

   ```sh
   npm run dev
   ```

5. Open `http://localhost:5173`. The API health check is at
   `http://localhost:5000/api/health`.

The client uses `VITE_API_URL` from `client/.env.example`; for local work its
default is `http://localhost:5000/api`. The server's `CLIENT_URL` should match
the frontend origin exactly.

Run backend validation tests with `npm test --prefix server`. Create a
non-production demo account and sample history by setting `DEMO_EMAIL` and
`DEMO_PASSWORD` in `server/.env`, then running `npm run seed:demo --prefix server`.
The seed script never prints the password and leaves an account with existing
tasks or habits unchanged.

## API overview

Protected routes require `Authorization: Bearer <token>`. Errors use
`{ "message": "..." }`.

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/health` | API health check |
| POST | `/api/auth/signup` | Create an account with `name`, `email`, and `password` |
| POST | `/api/auth/login` | Sign in with `email` and `password` |
| GET | `/api/auth/me` | Return the authenticated user |
| GET | `/api/tasks?date=YYYY-MM-DD` | List a user's tasks for one date |
| POST | `/api/tasks` | Create a pending task with `title` and `date` |
| PATCH | `/api/tasks/:id` | Change `title` and/or `status` |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/habits?start=…&end=…&asOf=…` | List habits, logs, and streaks for a date range |
| POST | `/api/habits` | Create a habit with `name` and local `createdDate` |
| PATCH | `/api/habits/:id` | Rename a habit |
| DELETE | `/api/habits/:id` | Delete a habit and its logs |
| PUT | `/api/habits/:id/logs/:date` | Upsert a `done` or `missed` log |
| DELETE | `/api/habits/:id/logs/:date` | Clear a habit log |
| GET | `/api/reports/weekly?start=YYYY-MM-DD` | Monday-to-Sunday report; `start` defaults to the current week |
| GET | `/api/reports/monthly?month=YYYY-MM` | Daily and week-by-week report; month defaults to the current month |

Report requests also accept `today=YYYY-MM-DD`. The client sends its local
calendar date so report boundaries and streaks do not depend on the server's
timezone. For full request and response examples, see
[docs/API_TESTS.md](./docs/API_TESTS.md).

## Completion rules

- Task completion is `done / (done + missed + pending)`. Cancelled tasks are
  excluded; an empty denominator produces 0%.
- Habit completion is `done / active habits`. Unmarked active days count as not
  done; habits are included only from their local `createdDate`.
- A current streak continues through yesterday when today is still unmarked. A
  missed day ends the current streak. Longest streaks use consecutive done
  calendar days.
- Best and worst report days are based on task completion. Days without any
  eligible tasks do not qualify, so an empty period has `null` best/worst days.

## Database schema

| Model | Main fields | Important indexes |
| --- | --- | --- |
| User | `name`, unique lowercase `email`, `passwordHash` | Unique email |
| Task | `user`, `title`, `date`, `status` | `{ user, date }` |
| Habit | `user`, `name`, local `createdDate` | `{ user, createdDate }` |
| HabitLog | `user`, `habit`, `date`, `status` | Unique `{ habit, date }`; `{ user, date }` |

Every task, habit, and log query is scoped to the authenticated user. Habit
creation stores both MongoDB's `createdAt` timestamp and the local calendar
`createdDate` supplied by the browser; reports use that calendar date so a
habit is not shifted across midnight by timezone conversion.

## Screenshots

Screenshots are not included yet. Add the Today, Habits, Weekly Report, and
Monthly Report screenshots here after capturing them from a demo account.

## Deployment

### MongoDB Atlas

1. Create a cluster and database user, then copy the Atlas connection string.
2. Restrict Network Access to the addresses required by your hosting setup.
   Avoid broad allowlists when a narrower option is available.
3. Keep the connection string private; set it as a Render environment variable,
   not in source control.

### Render API

1. Create a Render Web Service from this repository and set its **Root
   Directory** to `server`.
2. Use `npm install` as the build command and `npm start` as the start command.
   The package engine declares Node.js 24.
3. Set these environment variables in Render:
   - `MONGO_URI`: the Atlas connection string
   - `JWT_SECRET`: a strong, unique random value stored only in Render
   - `CLIENT_URL`: the exact deployed Vercel origin, without a trailing slash
   - `PORT`: normally supplied by Render
4. After deployment, check `https://<your-render-service>/api/health`.

### Vercel client

1. Import the same repository into Vercel and set **Root Directory** to `client`.
2. Use `npm run build` as the build command and `dist` as the output directory.
   `client/vercel.json` sends client-side routes back to the Vite app.
3. Set `VITE_API_URL` to `https://<your-render-service>/api`.
4. Confirm Render's `CLIENT_URL` matches the deployed Vercel origin, then open
   the Vercel URL and test signup, tasks, habits, and reports.

