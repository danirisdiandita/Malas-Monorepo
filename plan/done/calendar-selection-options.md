# Calendar selection options for mobile

## Recommendation for yuzu

Use a small custom calendar selector for the current Daily Planner mockup:

- Keep the Monday–Sunday week strip already shown.
- Open a modal when the user needs to select another date.
- Use local state first; no package or backend is needed.
- Add a calendar library only when month navigation, marked dates, or agenda
  behavior is required.

## Options

### 1. Custom React Native calendar

- Best match for the Pencil design and the current seven-day planner.
- No additional dependency or native rebuild.
- Easy to keep the Monday-first week behavior.
- Requires implementing month navigation and date rules later.

### 2. `@react-native-community/datetimepicker`

- Native date and time picker for Android and iOS.
- Best for selecting one date, time, start date, or end date.
- Android provides an imperative dialog API.
- Less suitable for a styled monthly calendar or meal-planning grid.
- Expo installation: `npx expo install @react-native-community/datetimepicker`.

Reference: https://docs.expo.dev/versions/latest/sdk/date-time-picker/

### 3. Expo UI DateTimePicker

- Expo's UI drop-in replacement around the native date/time picker.
- Good option if the app already uses `@expo/ui` and only needs native date
  selection.
- Still not a full meal-planning calendar or agenda.

Reference: https://docs.expo.dev/versions/latest/sdk/ui/drop-in-replacements/datetimepicker/

### 4. `react-native-calendars`

- Full JavaScript calendar components for month, week, agenda, and marked
  dates.
- Compatible with Expo without ejecting and requires no native module linking.
- Good for a future planner with scheduled meals and marked recipe days.
- More dependency and styling work than the current mockup needs.

Reference: https://github.com/wix/react-native-calendars

### 5. `expo-calendar`

- Accesses the device's system calendars, events, and reminders.
- Useful only if yuzu should sync meal plans with the user's device calendar.
- It is not a visual date-picker component.
- Requires permissions and a development build.

Reference: https://docs.expo.dev/versions/latest/sdk/calendar/

## Decision

- [ ] Keep the custom Monday-first week selector for the mockup.
- [ ] Let users choose a whole week, not an individual date.
- [ ] Add previous-week and next-week controls.
- [ ] Keep Monday as the first day and Sunday as the last day.
- [ ] Show the selected week as a range, for example `Sep 7–13`.
- [ ] Highlight the selected week consistently across all seven days.
- [ ] Consider a week-selection modal or week-row calendar if users need to
  jump to another week.
- [ ] Consider `react-native-calendars` when the planner needs marked dates,
  month navigation, or an agenda.
- [ ] Do not add `expo-calendar` unless device calendar synchronization is
  explicitly required.

## Week selection behavior

The planner should use a `week_start` value as its selection state rather than
a selected date. The displayed seven days are derived from that Monday.

```text
selected week: 2026-09-07
visible days: 2026-09-07 through 2026-09-13
```

Selecting any day in a week selects the entire week. Meal plans, summaries,
and navigation should use the selected `week_start`.
