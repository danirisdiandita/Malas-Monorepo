import { Ionicons } from "@react-native-vector-icons/ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const colors = {
  ink: "#14231A",
  leaf: "#4E8B5B",
  sage: "#DDE8D6",
  muted: "#738078",
  line: "#D9E1D7",
  tomato: "#E87955",
  sun: "#F8C957",
};
const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function startOfWeek(date: Date) {
  const monday = new Date(date);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekDays(monday: Date) {
  return dayNames.map((name, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { name, date: String(date.getDate()), value: date };
  });
}

function sameDay(first: Date, second: Date) {
  return first.toDateString() === second.toDateString();
}

function calendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayIndex = (firstDay.getDay() + 6) % 7;
  const totalDays = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  return [
    ...Array(mondayIndex).fill(null),
    ...Array.from(
      { length: totalDays },
      (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1),
    ),
  ];
}

function weekLabel(monday: Date) {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const month = monday.toLocaleDateString(undefined, { month: "short" });
  const endMonth = sunday.toLocaleDateString(undefined, { month: "short" });
  return `${month} ${monday.getDate()}–${endMonth} ${sunday.getDate()}`;
}

export default function PlannerScreen() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const days = getWeekDays(weekStart);
  const today = new Date();
  const moveWeek = (amount: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + amount * 7);
    setWeekStart(next);
    setSelectedDate(new Date(next));
  };
  const goToToday = () => {
    const next = new Date();
    setSelectedDate(next);
    setWeekStart(startOfWeek(next));
    setCalendarMonth(next);
    setCalendarOpen(false);
  };
  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setWeekStart(startOfWeek(date));
    setCalendarMonth(date);
    setCalendarOpen(false);
  };
  const monthLabel = calendarMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const selectedDateLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText style={styles.eyebrow}>YOUR WEEK</ThemedText>
          <View style={styles.titleRow}><ThemedText style={styles.title}>Daily planner</ThemedText><Pressable style={styles.calendarButton} onPress={() => setCalendarOpen(true)}><Ionicons name="calendar-outline" size={16} color={colors.ink} /><ThemedText style={styles.calendarButtonLabel}>Pick a date</ThemedText></Pressable></View>
          <View style={styles.weekHeader}>
            <Pressable
              accessibilityLabel="Previous week"
              style={styles.weekButton}
              onPress={() => moveWeek(-1)}
            >
              <Ionicons name="chevron-back" size={18} color={colors.ink} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={styles.weekLabelButton}
              onPress={() => setCalendarOpen(true)}
            >
              <ThemedText style={styles.weekLabel}>
                {weekLabel(weekStart)}
              </ThemedText>
              <Ionicons name="calendar-outline" size={16} color={colors.leaf} />
            </Pressable>
            <Pressable
              accessibilityLabel="Next week"
              style={styles.weekButton}
              onPress={() => moveWeek(1)}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.ink} />
            </Pressable>
          </View>
          <View style={styles.days}>
            {days.map(({ name, date, value }) => {
              const selected = sameDay(value, selectedDate);
              const isToday = sameDay(value, today);
              return (
                <Pressable
                  key={name}
                  onPress={() => setSelectedDate(value)}
                  style={[
                    styles.day,
                    isToday && styles.todayDay,
                    selected && styles.selectedDay,
                    selected && isToday && styles.selectedTodayDay,
                  ]}
                >
                  <ThemedText
                    style={[styles.dayName, selected && styles.selectedText]}
                  >
                    {name}
                  </ThemedText>
                  <ThemedText
                    style={[styles.date, selected && styles.selectedText]}
                  >
                    {date}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <Modal
            visible={calendarOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setCalendarOpen(false)}
          >
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setCalendarOpen(false)}
            >
              <Pressable
                style={styles.calendarDialog}
                onPress={(event) => event.stopPropagation()}
              >
                <View style={styles.dialogHeader}>
                  <ThemedText style={styles.dialogTitle}>
                    Choose a date
                  </ThemedText>
                  <Pressable
                    accessibilityLabel="Close calendar"
                    onPress={() => setCalendarOpen(false)}
                  >
                    <Ionicons name="close" size={22} color={colors.ink} />
                  </Pressable>
                </View>
                <View style={styles.monthHeader}>
                  <Pressable
                    style={styles.monthButton}
                    onPress={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() - 1,
                          1,
                        ),
                      )
                    }
                  >
                    <Ionicons
                      name="chevron-back"
                      size={18}
                      color={colors.ink}
                    />
                  </Pressable>
                  <ThemedText style={styles.monthLabel}>
                    {monthLabel}
                  </ThemedText>
                  <Pressable
                    style={styles.monthButton}
                    onPress={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() + 1,
                          1,
                        ),
                      )
                    }
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.ink}
                    />
                  </Pressable>
                </View>
                <View style={styles.calendarWeekdays}>
                  {dayNames.map((day) => (
                    <ThemedText key={day} style={styles.calendarWeekday}>
                      {day.slice(0, 1)}
                    </ThemedText>
                  ))}
                </View>
                <View style={styles.calendarGrid}>
                  {calendarDays(calendarMonth).map((date, index) =>
                    date ? (
                      <Pressable
                        key={date.toISOString()}
                        style={[
                          styles.calendarDay,
                          sameDay(date, selectedDate) &&
                            styles.calendarSelectedDay,
                          sameDay(date, today) && styles.calendarTodayDay,
                        ]}
                        onPress={() => selectDate(date)}
                      >
                        <ThemedText
                          style={[
                            styles.calendarDayLabel,
                            sameDay(date, selectedDate) &&
                              styles.calendarSelectedLabel,
                          ]}
                        >
                          {date.getDate()}
                        </ThemedText>
                      </Pressable>
                    ) : (
                      <View key={`empty-${index}`} style={styles.calendarDay} />
                    ),
                  )}
                </View>
                <Pressable style={styles.modalTodayButton} onPress={goToToday}>
                  <Ionicons name="today-outline" size={16} color={colors.leaf} />
                  <ThemedText style={styles.todayButtonLabel}>Today</ThemedText>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>

          <ThemedText style={styles.today}>{selectedDateLabel}</ThemedText>
          {[
            ["BREAKFAST", "Greek yogurt bowl", "20 min", "cafe-outline"],
            ["LUNCH", "Green goddess bowl", "Fresh · 25 min", "leaf-outline"],
            [
              "DINNER",
              "Miso butter salmon",
              "Tonight · 30 min",
              "fish-outline",
            ],
          ].map(([meal, name, meta, icon]) => (
            <View key={meal} style={styles.mealRow}>
              <ThemedText style={styles.mealLabel}>{meal}</ThemedText>
              <View style={styles.mealCard}>
                <View style={styles.mealIcon}>
                  <Ionicons
                    name={icon as never}
                    size={20}
                    color={colors.leaf}
                  />
                </View>
                <View>
                  <ThemedText style={styles.mealName}>{name}</ThemedText>
                  <ThemedText style={styles.mealMeta}>{meta}</ThemedText>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FCFBF8" },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 30 },
  eyebrow: {
    color: colors.leaf,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginTop: -8, flex: 1 },
  weekHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  weekLabelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  weekLabel: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  weekActions: { flexDirection: "row", gap: 8 },
  todayButton: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.sage,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  todayButtonLabel: { color: colors.leaf, fontSize: 14, fontWeight: "800" },
  modalTodayButton: { minHeight: 44, borderRadius: 12, backgroundColor: colors.sage, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  calendarButton: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  calendarButtonLabel: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  days: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  day: {
    width: 42,
    height: 60,
    borderRadius: 13,
    backgroundColor: colors.sage,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  todayDay: { borderColor: colors.sun },
  selectedDay: { backgroundColor: colors.ink, borderColor: colors.ink },
  selectedTodayDay: { borderColor: colors.sun },
  dayName: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  date: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  selectedText: { color: "#fff" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#14231A66",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  calendarDialog: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    backgroundColor: "#FCFBF8",
    padding: 18,
    gap: 12,
  },
  dialogHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dialogTitle: { color: colors.ink, fontSize: 20, fontWeight: "800" },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  calendarWeekdays: { flexDirection: "row", justifyContent: "space-between" },
  calendarWeekday: {
    width: 36,
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 8 },
  calendarDay: {
    width: "14.285%",
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayLabel: { color: colors.ink, fontSize: 14 },
  calendarSelectedDay: { backgroundColor: colors.ink, borderRadius: 18 },
  calendarTodayDay: {
    borderWidth: 1,
    borderColor: colors.sun,
    borderRadius: 18,
  },
  calendarSelectedLabel: { color: "#fff", fontWeight: "800" },
  summary: {
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: colors.sage,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  summaryTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  summaryMeta: { color: colors.muted, fontSize: 13, marginTop: 3 },
  today: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 4,
  },
  mealRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  mealLabel: {
    color: colors.muted,
    width: 52,
    fontSize: 11,
    fontWeight: "900",
  },
  mealCard: {
    flex: 1,
    minHeight: 64,
    borderRadius: 13,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 9,
  },
  mealIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  mealName: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  mealMeta: { color: colors.muted, fontSize: 13, marginTop: 3 },
});
