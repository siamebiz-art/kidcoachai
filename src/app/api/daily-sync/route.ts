import { auth, clerkClient } from "@clerk/nextjs/server";

interface DailySync {
  date: string;
  screenMinutes: number;
  physicalMinutes: number;
  readingMinutes: number;
  parentMinutes: number;
  completedMissions: string[];
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function empty(): DailySync {
  return { date: todayStr(), screenMinutes: 0, physicalMinutes: 0, readingMinutes: 0, parentMinutes: 0, completedMissions: [] };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.unsafeMetadata as Record<string, unknown>;
  const sync = meta.kidoDailySync as DailySync | undefined;

  if (!sync || sync.date !== todayStr()) return Response.json(empty());
  return Response.json(sync);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: Partial<DailySync>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const today = todayStr();
  if (body.date && body.date !== today) {
    return Response.json({ error: "Invalid date" }, { status: 400 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.unsafeMetadata as Record<string, unknown>;
  const existing = meta.kidoDailySync as DailySync | undefined;

  const base = existing && existing.date === today ? existing : empty();

  const merged: DailySync = {
    date: today,
    screenMinutes:   Math.max(base.screenMinutes,   body.screenMinutes   ?? 0),
    physicalMinutes: Math.max(base.physicalMinutes, body.physicalMinutes ?? 0),
    readingMinutes:  Math.max(base.readingMinutes,  body.readingMinutes  ?? 0),
    parentMinutes:   Math.max(base.parentMinutes,   body.parentMinutes   ?? 0),
    completedMissions: Array.from(new Set([...base.completedMissions, ...(body.completedMissions ?? [])])),
  };

  await client.users.updateUserMetadata(userId, {
    unsafeMetadata: { ...meta, kidoDailySync: merged },
  });

  return Response.json({ ok: true, data: merged });
}
