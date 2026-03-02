"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Flame } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import type { Habit, HabitLog } from "@/types/database";

const EMOJI_OPTIONS = ["✅", "💪", "📚", "🏃", "💧", "🧘", "✍️", "🎵", "💤", "🥗"];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayLogs, setTodayLogs] = useState<HabitLog[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [newHabit, setNewHabit] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("✅");
  const [showAdd, setShowAdd] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, [supabase]);

  const today = new Date().toISOString().split("T")[0];

  const loadData = useCallback(async () => {
    const [habitsRes, logsRes] = await Promise.all([
      supabase.from("habits").select("*").order("created_at"),
      supabase.from("habit_logs").select("*").eq("date", today),
    ]);
    if (habitsRes.data) setHabits(habitsRes.data);
    if (logsRes.data) setTodayLogs(logsRes.data);

    // Calculate streaks
    if (habitsRes.data) {
      const streakMap: Record<string, number> = {};
      for (const habit of habitsRes.data) {
        const { data: logs } = await supabase
          .from("habit_logs")
          .select("date")
          .eq("habit_id", habit.id)
          .order("date", { ascending: false })
          .limit(60);
        let streak = 0;
        if (logs) {
          const dates = logs.map((l) => l.date);
          const d = new Date();
          for (let i = 0; i < 60; i++) {
            const dateStr = d.toISOString().split("T")[0];
            if (dates.includes(dateStr)) {
              streak++;
            } else if (i > 0) {
              break;
            }
            d.setDate(d.getDate() - 1);
          }
        }
        streakMap[habit.id] = streak;
      }
      setStreaks(streakMap);
    }
  }, [supabase, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addHabit = async () => {
    if (!newHabit.trim() || !userId) return;
    const { error } = await supabase
      .from("habits")
      .insert({ name: newHabit.trim(), icon: selectedIcon, user_id: userId });
    if (error) {
      toast.error("추가 실패");
      return;
    }
    setNewHabit("");
    setShowAdd(false);
    loadData();
    toast.success("습관 추가!");
  };

  const toggleHabit = async (habitId: string) => {
    const existing = todayLogs.find((l) => l.habit_id === habitId);
    if (existing) {
      await supabase.from("habit_logs").delete().eq("id", existing.id);
    } else {
      await supabase
        .from("habit_logs")
        .insert({ habit_id: habitId, date: today, user_id: userId! });
    }
    loadData();
  };

  const deleteHabit = async (habitId: string) => {
    await supabase.from("habits").delete().eq("id", habitId);
    loadData();
    toast.success("삭제됨");
  };

  const isChecked = (habitId: string) =>
    todayLogs.some((l) => l.habit_id === habitId);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">습관 트래커</h1>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">추가</span>
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-4 space-y-3"
          >
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedIcon(emoji)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                    selectedIcon === emoji
                      ? "bg-primary/20 scale-110"
                      : "hover:bg-secondary"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                placeholder="습관 이름 (예: 물 2L 마시기)"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && addHabit()}
              />
              <Button onClick={addHabit} size="sm">
                추가
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {habits.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-muted-foreground">
              첫 번째 습관을 추가해보세요
            </p>
          </div>
        ) : (
          habits.map((habit, i) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass rounded-2xl p-4 flex items-center gap-3 transition-all ${
                isChecked(habit.id) ? "opacity-70" : ""
              }`}
            >
              <button
                onClick={() => toggleHabit(habit.id)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                  isChecked(habit.id)
                    ? "bg-primary/20 scale-95"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {isChecked(habit.id) ? "✓" : habit.icon}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium truncate ${
                    isChecked(habit.id)
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {habit.name}
                </p>
                {(streaks[habit.id] ?? 0) > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Flame size={12} className="text-orange-400" />
                    {streaks[habit.id]}일 연속
                  </p>
                )}
              </div>

              <button
                onClick={() => deleteHabit(habit.id)}
                className="text-muted-foreground/50 hover:text-destructive transition-colors p-1"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
