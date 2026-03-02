import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

webpush.setVapidDetails(
  "mailto:haena@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  // Verify cron secret or allow manual trigger
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 1. Check habits - remind if not all checked today
  const { data: habits } = await supabase.from("habits").select("*");
  const { data: todayLogs } = await supabase
    .from("habit_logs")
    .select("habit_id")
    .eq("date", today);

  const checkedIds = new Set((todayLogs ?? []).map((l) => l.habit_id));
  const uncheckedHabits = (habits ?? []).filter((h) => !checkedIds.has(h.id));

  // 2. Check events coming up in the next 30 minutes
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .eq("date", today)
    .not("start_time", "is", null);

  const soonEvents = (upcomingEvents ?? []).filter((e) => {
    if (!e.start_time) return false;
    const eventTime = e.start_time.slice(0, 5);
    const eventMinutes =
      parseInt(eventTime.split(":")[0]) * 60 + parseInt(eventTime.split(":")[1]);
    const nowMinutes =
      parseInt(currentTime.split(":")[0]) * 60 +
      parseInt(currentTime.split(":")[1]);
    const diff = eventMinutes - nowMinutes;
    return diff > 0 && diff <= 30;
  });

  // 3. Get all push subscriptions
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ message: "No subscriptions" });
  }

  const notifications: { title: string; body: string; url: string }[] = [];

  if (uncheckedHabits.length > 0 && now.getHours() >= 20) {
    notifications.push({
      title: "오늘의 습관 체크 ✅",
      body: `${uncheckedHabits.length}개 습관이 아직 체크되지 않았어요!`,
      url: "/habits",
    });
  }

  for (const event of soonEvents) {
    notifications.push({
      title: `곧 일정이 있어요 📅`,
      body: `${event.start_time.slice(0, 5)} ${event.title}`,
      url: "/calendar",
    });
  }

  if (notifications.length === 0) {
    return NextResponse.json({ message: "No notifications to send" });
  }

  let sent = 0;
  for (const sub of subscriptions) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
    };
    for (const notif of notifications) {
      try {
        await webpush.sendNotification(pushSub, JSON.stringify(notif));
        sent++;
      } catch {
        // Subscription expired, remove it
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
    }
  }

  return NextResponse.json({ sent, notifications: notifications.length });
}
