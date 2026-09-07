# Meal Calendar Timezone Plan

Use each user's local timezone as the source of truth for meal planning.

## 1. Store the user's timezone

Add this field to `users`:

```text
timezone string NOT NULL DEFAULT "UTC"
```

Store IANA timezone names, for example:

```text
Asia/Jakarta
America/New_York
Europe/Berlin
```

Do not store only a fixed offset such as `UTC+7`; offsets do not handle daylight-saving changes.

## 2. Add meal calendar entries

Create a `meal_calendar_entries` table:

| Field | Type | Description |
| --- | --- | --- |
| `id` | identifier | Meal entry identifier. |
| `user_id` | identifier | Foreign key to `users.id`. |
| `planned_date` | date | Local calendar date. |
| `meal_slot` | string | For example `breakfast`, `lunch`, or `dinner`. |
| `scheduled_time` | time or null | Local meal time, if the user schedules one. |
| `recipe_id` | identifier or null | Optional foreign key to `recipes.id`. |
| `timezone` | string | IANA timezone used when the entry was created. |
| `notes` | string or null | Optional notes. |

Example:

```text
2026-09-07 | breakfast | 07:30 | Asia/Jakarta
2026-09-07 | lunch     | 12:00 | Asia/Jakarta
2026-09-07 | dinner    | 19:00 | Asia/Jakarta
```

## 3. Keep planning values local

Treat `planned_date` and `scheduled_time` as local values. Do not convert a meal date through UTC. A meal planned for September 7 must remain September 7 in the user's calendar.

## 4. Convert only reminders to UTC

When creating a reminder, combine the local date, local time, and IANA timezone, then convert that instant to UTC for the notification system.

The application should:

- accept and display calendar values in the user's timezone;
- store actual timestamps such as `reminded_at` in UTC;
- convert UTC timestamps back to the user's timezone in the UI.

## 5. Support recurring meal plans

Store recurring schedules in local time. For example, “breakfast every day at 07:30” should remain `07:30` in the user's timezone when daylight-saving rules change.

Do not model a recurring schedule as a permanently fixed UTC time.

## 6. Handle timezone changes

- Future unsent meals use the user's new timezone.
- Completed or historical entries keep their original `timezone`.
- Already-sent reminders are not rescheduled.

## 7. Support 3–5 meals per day

Use flexible meal-slot values:

```text
breakfast
morning_snack
lunch
afternoon_snack
dinner
```

Keep `meal_slot` as a string rather than hardcoding only breakfast, lunch, and dinner. This supports three, four, or five meals per day without another schema change.

## Core rule

Calendar planning uses local date and time. Notifications and actual event timestamps use UTC.
