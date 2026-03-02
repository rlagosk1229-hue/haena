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

async function sendPushNotifications() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // KST = UTC+9, Vercel cron runs at UTC 11:00 = KST 20:00
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const today = kstNow.toISOString().split("T")[0];

  // 1. Check habits - remind if not all checked today
  const { data: habits } = await supabase.from("habits").select("*");
  const { data: todayLogs } = await supabase
    .from("habit_logs")
    .select("habit_id")
    .eq("date", today);

  const checkedIds = new Set((todayLogs ?? []).map((l) => l.habit_id));
  const uncheckedHabits = (habits ?? []).filter((h) => !checkedIds.has(h.id));

  // 2. Check tomorrow's events (since this runs at night)
  const tomorrow = new Date(kstNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const { data: tomorrowEvents } = await supabase
    .from("events")
    .select("*")
    .eq("date", tomorrowStr);

  // 3. Get all push subscriptions
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (!subscriptions || subscriptions.length === 0) {
    return { message: "No subscriptions" };
  }

  const notifications: { title: string; body: string; url: string }[] = [];

  if (uncheckedHabits.length > 0) {
    notifications.push({
      title: "오늘의 습관 체크 ✅",
      body: `${uncheckedHabits.length}개 습관이 아직 체크되지 않았어요!`,
      url: "/habits",
    });
  }

  if (tomorrowEvents && tomorrowEvents.length > 0) {
    const eventNames = tomorrowEvents.map((e) => e.title).join(", ");
    notifications.push({
      title: "내일 일정 알림 📅",
      body: `내일 ${tomorrowEvents.length}개 일정: ${eventNames}`,
      url: "/calendar",
    });
  }

  if (notifications.length === 0) {
    return { message: "No notifications to send" };
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
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
    }
  }

  return { sent, notifications: notifications.length };
}

// Vercel Cron calls GET
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendPushNotifications();
  return NextResponse.json(result);
}

// Manual trigger via POST
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendPushNotifications();
  return NextResponse.json(result);
}
