import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { TasksRepo, GamificationRepo, NotificationsRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Consolidated task actions: complete, uncomplete, snooze, duplicate,
// add-subtask, move-kanban — keeps the task action surface (section 3) on
// one endpoint instead of ~6 near-identical route files.
export const POST = withAuth(async (req, { userId, params }) => {
  const body = await req.json();
  const { action } = body;
  const id = params.id;

  switch (action) {
    case "complete": {
      const task = TasksRepo.completeTask(userId, id, body.actualMinutes);
      GamificationRepo.addXP(userId, 15);
      GamificationRepo.touchActivityStreak(userId);
      const newBadges = GamificationRepo.checkAndAwardBadges(userId);
      for (const b of newBadges) {
        NotificationsRepo.createNotification(userId, { type: "badge", title: `Badge earned: ${b.title}`, message: b.description ?? undefined, icon: b.icon });
      }
      return NextResponse.json({ task, newBadges });
    }
    case "uncomplete":
      return NextResponse.json({ task: TasksRepo.uncompleteTask(userId, id) });
    case "snooze":
      return NextResponse.json({ task: TasksRepo.snoozeTask(userId, id, body.date, body.startTime) });
    case "duplicate":
      return NextResponse.json({ task: TasksRepo.duplicateTask(userId, id) }, { status: 201 });
    case "add-subtask":
      return NextResponse.json({ task: TasksRepo.addSubtask(userId, id, body.title) }, { status: 201 });
    case "move-kanban":
      return NextResponse.json({ task: TasksRepo.moveKanban(userId, id, body.column) });
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
});
