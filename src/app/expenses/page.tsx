"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import type { ExpenseCategory, Expense } from "@/types/database";

const DEFAULT_CATEGORIES = [
  { name: "식비", emoji: "🍚" },
  { name: "교통", emoji: "🚌" },
  { name: "주거", emoji: "🏠" },
  { name: "쇼핑", emoji: "🛒" },
  { name: "여가", emoji: "🎮" },
  { name: "카페", emoji: "☕" },
  { name: "의료", emoji: "💊" },
  { name: "기타", emoji: "📦" },
];

const CHART_COLORS = [
  "oklch(0.65 0.2 250)",
  "oklch(0.7 0.18 160)",
  "oklch(0.75 0.15 50)",
  "oklch(0.6 0.2 300)",
  "oklch(0.7 0.2 30)",
  "oklch(0.65 0.15 200)",
  "oklch(0.75 0.2 100)",
  "oklch(0.6 0.18 350)",
];

function getKSTDate() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];
}

function getKSTMonth() {
  return getKSTDate().slice(0, 7);
}

function formatAmount(n: number) {
  return n.toLocaleString("ko-KR");
}

function getWeekRange(weeksAgo: number) {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset - weeksAgo * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
    label: weeksAgo === 0 ? "이번 주" : weeksAgo === 1 ? "지난 주" : `${weeksAgo}주 전`,
  };
}

export default function ExpensesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [chartTab, setChartTab] = useState<"weekly" | "category">("weekly");

  // Form state
  const [formType, setFormType] = useState<"expense" | "income">("expense");
  const [formAmount, setFormAmount] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formMemo, setFormMemo] = useState("");
  const [formDate, setFormDate] = useState(getKSTDate);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, [supabase]);

  const seedDefaultCategories = useCallback(
    async (uid: string) => {
      const inserts = DEFAULT_CATEGORIES.map((c) => ({
        name: c.name,
        emoji: c.emoji,
        user_id: uid,
        is_default: true,
      }));
      await supabase.from("expense_categories").insert(inserts);
    },
    [supabase]
  );

  const loadCategories = useCallback(async () => {
    const { data } = await supabase
      .from("expense_categories")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at");
    if (data && data.length > 0) {
      setCategories(data);
    } else if (userId) {
      await seedDefaultCategories(userId);
      const { data: seeded } = await supabase
        .from("expense_categories")
        .select("*")
        .order("created_at");
      if (seeded) setCategories(seeded);
    }
  }, [supabase, userId, seedDefaultCategories]);

  const loadExpenses = useCallback(async () => {
    const month = getKSTMonth();
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .gte("date", `${month}-01`)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setExpenses(data);
  }, [supabase]);

  useEffect(() => {
    if (userId) {
      loadCategories();
      loadExpenses();
    }
  }, [userId, loadCategories, loadExpenses]);

  // Monthly summary
  const summary = useMemo(() => {
    const income = expenses
      .filter((e) => e.type === "income")
      .reduce((s, e) => s + e.amount, 0);
    const expense = expenses
      .filter((e) => e.type === "expense")
      .reduce((s, e) => s + e.amount, 0);
    return { income, expense, balance: income - expense };
  }, [expenses]);

  // Weekly chart data (last 4 weeks)
  const weeklyData = useMemo(() => {
    const weeks = Array.from({ length: 4 }, (_, i) => {
      const range = getWeekRange(3 - i);
      const total = expenses
        .filter((e) => e.type === "expense" && e.date >= range.start && e.date <= range.end)
        .reduce((s, e) => s + e.amount, 0);
      return { ...range, total };
    });
    return weeks;
  }, [expenses]);

  const weeklyMax = useMemo(
    () => Math.max(...weeklyData.map((w) => w.total), 1),
    [weeklyData]
  );

  // Week-over-week change
  const weekChange = useMemo(() => {
    const thisWeek = weeklyData[3]?.total ?? 0;
    const lastWeek = weeklyData[2]?.total ?? 0;
    if (lastWeek === 0) return null;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  }, [weeklyData]);

  // Category donut data
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses
      .filter((e) => e.type === "expense" && e.category_id)
      .forEach((e) => {
        map.set(e.category_id!, (map.get(e.category_id!) ?? 0) + e.amount);
      });
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .map(([catId, amount], i) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          catId,
          name: cat?.name ?? "기타",
          emoji: cat?.emoji ?? "📦",
          amount,
          percent: total > 0 ? (amount / total) * 100 : 0,
          color: CHART_COLORS[i % CHART_COLORS.length],
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, categories]);

  const donutGradient = useMemo(() => {
    if (categoryData.length === 0) return "conic-gradient(var(--muted) 0% 100%)";
    let acc = 0;
    const stops = categoryData.map((d) => {
      const start = acc;
      acc += d.percent;
      return `${d.color} ${start}% ${acc}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [categoryData]);

  // Grouped expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: { date: string; items: Expense[] }[] = [];
    expenses.forEach((e) => {
      const last = groups[groups.length - 1];
      if (last && last.date === e.date) {
        last.items.push(e);
      } else {
        groups.push({ date: e.date, items: [e] });
      }
    });
    return groups;
  }, [expenses]);

  const addExpense = async () => {
    const amount = parseInt(formAmount.replace(/,/g, ""), 10);
    if (!amount || amount <= 0 || !userId || saving) return;
    setSaving(true);
    const { error } = await supabase.from("expenses").insert({
      type: formType,
      amount,
      category_id: formCategoryId || null,
      memo: formMemo.trim() || null,
      date: formDate,
      user_id: userId,
    });
    setSaving(false);
    if (error) {
      toast.error("추가 실패");
      return;
    }
    setFormAmount("");
    setFormMemo("");
    setFormCategoryId("");
    setShowAdd(false);
    loadExpenses();
    toast.success(formType === "income" ? "수입 추가!" : "지출 추가!");
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("이 항목을 삭제할까요?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast.error("삭제 실패");
      return;
    }
    loadExpenses();
    toast.success("삭제됨");
  };

  const getCategoryById = (id: string | null) =>
    categories.find((c) => c.id === id);

  const formatDateLabel = (dateStr: string) => {
    const today = getKSTDate();
    if (dateStr === today) return "오늘";
    const yesterday = new Date(Date.now() + 9 * 60 * 60 * 1000);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split("T")[0]) return "어제";
    const [, m, d] = dateStr.split("-");
    return `${parseInt(m)}월 ${parseInt(d)}일`;
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">가계부</h1>
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

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-4 space-y-3"
          >
            {/* Income / Expense toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setFormType("expense")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  formType === "expense"
                    ? "bg-red-500/15 text-red-500 dark:text-red-400"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                지출
              </button>
              <button
                onClick={() => setFormType("income")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  formType === "income"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                수입
              </button>
            </div>

            {/* Amount */}
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                value={formAmount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setFormAmount(raw ? parseInt(raw).toLocaleString("ko-KR") : "");
                }}
                placeholder="금액"
                className="pr-8"
                onKeyDown={(e) => e.key === "Enter" && addExpense()}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                원
              </span>
            </div>

            {/* Category picker */}
            {formType === "expense" && (
              <div className="flex gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setFormCategoryId(formCategoryId === cat.id ? "" : cat.id)
                    }
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                      formCategoryId === cat.id
                        ? "bg-primary/20 ring-1 ring-primary/40"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Memo & Date */}
            <div className="flex gap-2">
              <Input
                value={formMemo}
                onChange={(e) => setFormMemo(e.target.value)}
                placeholder="메모 (선택)"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && addExpense()}
              />
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-36"
              />
            </div>

            <Button onClick={addExpense} size="sm" className="w-full" disabled={saving}>
              {saving ? "추가 중..." : "추가"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monthly Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass rounded-2xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">수입</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {formatAmount(summary.income)}
          </p>
        </div>
        <div className="glass rounded-2xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">지출</p>
          <p className="text-sm font-bold text-red-500 dark:text-red-400">
            {formatAmount(summary.expense)}
          </p>
        </div>
        <div className="glass rounded-2xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">잔액</p>
          <p
            className={`text-sm font-bold ${
              summary.balance >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            {formatAmount(summary.balance)}
          </p>
        </div>
      </div>

      {/* Week change indicator */}
      {weekChange !== null && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          {weekChange > 0 ? (
            <>
              <TrendingUp size={14} className="text-red-400" />
              <span>지난주보다 <strong className="text-red-500">{weekChange}%</strong> 더 씀</span>
            </>
          ) : weekChange < 0 ? (
            <>
              <TrendingDown size={14} className="text-emerald-400" />
              <span>지난주보다 <strong className="text-emerald-500">{Math.abs(weekChange)}%</strong> 절약</span>
            </>
          ) : (
            <>
              <ArrowUpDown size={14} />
              <span>지난주와 동일</span>
            </>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="glass rounded-2xl p-4 space-y-4">
        {/* Tab buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setChartTab("weekly")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
              chartTab === "weekly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-secondary"
            }`}
          >
            주간
          </button>
          <button
            onClick={() => setChartTab("category")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
              chartTab === "category"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-secondary"
            }`}
          >
            카테고리
          </button>
        </div>

        <AnimatePresence mode="wait">
          {chartTab === "weekly" ? (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Weekly bar chart */}
              <div className="flex items-end gap-3 h-40">
                {weeklyData.map((week, i) => (
                  <div key={week.start} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      {formatAmount(week.total)}
                    </span>
                    <motion.div
                      className={`w-full rounded-lg ${
                        i === 3
                          ? "bg-primary"
                          : "bg-primary/30"
                      }`}
                      initial={{ height: 0 }}
                      animate={{
                        height: `${Math.max((week.total / weeklyMax) * 100, 4)}%`,
                      }}
                      transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
                    />
                    <span className="text-[10px] text-muted-foreground">{week.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {categoryData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  이번 달 지출 내역이 없습니다
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  {/* Donut chart */}
                  <div
                    className="w-28 h-28 rounded-full flex-shrink-0 relative"
                    style={{
                      background: donutGradient,
                    }}
                  >
                    <div className="absolute inset-3 rounded-full bg-background flex items-center justify-center">
                      <span className="text-xs font-bold">
                        {formatAmount(summary.expense)}
                      </span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {categoryData.slice(0, 5).map((d) => (
                      <div key={d.catId} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: d.color }}
                        />
                        <span className="truncate flex-1">
                          {d.emoji} {d.name}
                        </span>
                        <span className="text-muted-foreground flex-shrink-0">
                          {Math.round(d.percent)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {groupedExpenses.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💰</p>
            <p className="text-muted-foreground">
              첫 번째 내역을 추가해보세요
            </p>
          </div>
        ) : (
          groupedExpenses.map((group) => (
            <div key={group.date} className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium px-1">
                {formatDateLabel(group.date)}
              </p>
              {group.items.map((item, i) => {
                const cat = getCategoryById(item.category_id);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass rounded-2xl p-3 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                      {item.type === "income" ? "💵" : cat?.emoji ?? "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.memo || (item.type === "income" ? "수입" : cat?.name ?? "지출")}
                      </p>
                      {item.memo && item.type === "expense" && cat && (
                        <p className="text-[10px] text-muted-foreground">
                          {cat.emoji} {cat.name}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-sm font-bold flex-shrink-0 ${
                        item.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500 dark:text-red-400"
                      }`}
                    >
                      {item.type === "income" ? "+" : "-"}
                      {formatAmount(item.amount)}
                    </span>
                    <button
                      onClick={() => deleteExpense(item.id)}
                      className="text-muted-foreground/50 hover:text-destructive transition-colors p-1 flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
