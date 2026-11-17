# API request examples

These examples use PowerShell and assume the API is running at
`http://localhost:5000`. They create a temporary local test account and data.
Use your own test email and a temporary password; do not use a production
password.

## Sign up and save the token

```powershell
$base = "http://localhost:5000/api"
$password = Read-Host "Temporary test password"
$signupBody = @{
  name = "Test User"
  email = "you@example.com"
  password = $password
} | ConvertTo-Json

$session = Invoke-RestMethod -Method Post -Uri "$base/auth/signup" `
  -ContentType "application/json" -Body $signupBody
$headers = @{ Authorization = "Bearer $($session.token)" }
```

For an existing test account, use `POST /auth/login` with its email and
password instead. `GET /auth/me` verifies the token:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/auth/me" -Headers $headers
```

## Tasks

Use the local date format `yyyy-MM-dd`:

```powershell
$today = Get-Date -Format "yyyy-MM-dd"
$taskBody = @{ title = "Review class notes"; date = $today } | ConvertTo-Json
$task = Invoke-RestMethod -Method Post -Uri "$base/tasks" `
  -Headers $headers -ContentType "application/json" -Body $taskBody

Invoke-RestMethod -Method Get -Uri "$base/tasks?date=$today" -Headers $headers

$statusBody = @{ status = "done" } | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "$base/tasks/$($task.task.id)" `
  -Headers $headers -ContentType "application/json" -Body $statusBody

$renameBody = @{ title = "Review updated class notes" } | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "$base/tasks/$($task.task.id)" `
  -Headers $headers -ContentType "application/json" -Body $renameBody
```

Accepted task statuses are `pending`, `done`, `missed`, and `cancelled`.
Setting `pending` resets a task.

## Habits and logs

```powershell
$habitBody = @{ name = "Read for 20 minutes"; createdDate = $today } | ConvertTo-Json
$habit = Invoke-RestMethod -Method Post -Uri "$base/habits" `
  -Headers $headers -ContentType "application/json" -Body $habitBody

$weekStart = (Get-Date).AddDays(-(((Get-Date).DayOfWeek.value__ + 6) % 7)).ToString("yyyy-MM-dd")
$weekEnd = (Get-Date).AddDays(6 - (((Get-Date).DayOfWeek.value__ + 6) % 7)).ToString("yyyy-MM-dd")
Invoke-RestMethod -Method Get `
  -Uri "$base/habits?start=$weekStart&end=$weekEnd&asOf=$today" -Headers $headers

$logBody = @{ status = "done" } | ConvertTo-Json
Invoke-RestMethod -Method Put `
  -Uri "$base/habits/$($habit.habit.id)/logs/$today" `
  -Headers $headers -ContentType "application/json" -Body $logBody

Invoke-RestMethod -Method Delete `
  -Uri "$base/habits/$($habit.habit.id)/logs/$today" -Headers $headers
```

Log status must be `done` or `missed`. Sending the same date again updates the
existing log; deleting that date clears it.

## Reports

The optional `today` query uses the browser's local date. Without it, the API
uses the server's local calendar date.

```powershell
Invoke-RestMethod -Method Get `
  -Uri "$base/reports/weekly?today=$today" -Headers $headers

$month = $today.Substring(0, 7)
Invoke-RestMethod -Method Get `
  -Uri "$base/reports/monthly?month=$month&today=$today" -Headers $headers
```

Weekly `start` must be a Monday. The weekly response contains seven daily
records, totals, best/worst task-completion days, and per-habit daily statuses,
completion, and streaks. The monthly response contains all dates in the month,
calendar-week summaries, totals, best/worst days, habit completion, streaks,
and the count of days with 100% completion among active habits.

## Expected validation errors

Requests without a Bearer token return `401`. Invalid task dates, habit names,
statuses, or report ranges return a 4xx response with a JSON `message`. A
resource owned by another user is not returned or modified.
