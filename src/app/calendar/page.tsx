"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import type { CalendarEvent } from "@/types/database";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newMemo, setNewMemo] = useState("");
  const supabase = createClient();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadEvents = useCallback(async () => {
    const startOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;
    const { data } = await supabase
      .from("events")
      .select("*")
      .gte("date", startOfMonth)
      .lte("date", endOfMonth)
      .order("start_time");
    if (data) setEvents(data);
  }, [supabase, year, month]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = new Date().toISOString().split("T")[0];

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const eventsForDate = (dateStr: string) =>
    events.filter((e) => e.date === dateStr);

  const selectedEvents = eventsForDate(selectedDate);

  const addEvent = async () => {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from("events").insert({
      title: newTitle.trim(),
      date: selectedDate,
      start_time: newTime || null,
      memo: newMemo,
    });
    if (error) {
      toast.error("추가 실패");
      return;
    }
    setNewTitle("");
    setNewTime("");
    setNewMemo("");
    setShowAdd(false);
    loadEvents();
    toast.success("일정 추가!");
  };

  const deleteEvent = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    loadEvents();
    toast.success("삭제됨");
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 hover:bg-secondary rounded-xl transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-serif text-xl sm:text-2xl font-bold">
          {year}년 {month + 1}월
        </h1>
        <button onClick={nextMonth} className="p-2 hover:bg-secondary rounded-xl transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="glass rounded-2xl p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-medium py-1 ${
                i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-muted-foreground"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = getDateStr(day);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const hasEvents = eventsForDate(dateStr).length > 0;
            const dayOfWeek = new Date(year, month, day).getDay();

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-bold"
                    : isToday
                    ? "bg-primary/10 font-bold text-primary"
                    : dayOfWeek === 0
                    ? "text-red-400 hover:bg-secondary"
                    : dayOfWeek === 6
                    ? "text-blue-400 hover:bg-secondary"
                    : "hover:bg-secondary"
                }`}
              >
                {day}
                {hasEvents && (
                  <div
                    className={`absolute bottom-1 w-1 h-1 rounded-full ${
                      isSelected ? "bg-primary-foreground" : "bg-primary"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-sm text-muted-foreground">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </h2>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1"
            onClick={() => setShowAdd(!showAdd)}
          >
            <Plus size={16} />
            일정
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
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="일정 제목"
                onKeyDown={(e) => e.key === "Enter" && addEvent()}
              />
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-32"
                />
                <Input
                  value={newMemo}
                  onChange={(e) => setNewMemo(e.target.value)}
                  placeholder="메모 (선택)"
                  className="flex-1"
                />
              </div>
              <Button onClick={addEvent} size="sm" className="w-full">
                추가
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedEvents.length === 0 && !showAdd ? (
          <p className="text-center text-muted-foreground/60 text-sm py-8">
            일정이 없습니다
          </p>
        ) : (
          selectedEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4 flex items-start gap-3"
            >
              <div
                className="w-1 self-stretch rounded-full mt-0.5"
                style={{ backgroundColor: event.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{event.title}</p>
                {event.start_time && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock size={11} />
                    {event.start_time.slice(0, 5)}
                  </p>
                )}
                {event.memo && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {event.memo}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteEvent(event.id)}
                className="text-muted-foreground/50 hover:text-destructive transition-colors p-1"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
