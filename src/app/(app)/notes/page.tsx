"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiMutate } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUIStore } from "@/lib/store/uiStore";
import { EmptyState, Skeleton } from "@/components/ui/Skeleton";
import type { Note } from "@/types";
import { Plus, Search, Pin, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

export default function NotesPage() {
  const setNoteModalOpen = useUIStore((s) => s.setNoteModalOpen);
  const [search, setSearch] = useState("");
  const { data, isLoading, mutate } = useSWR<{ notes: Note[] }>(`/api/notes${search ? `?search=${encodeURIComponent(search)}` : ""}`, fetcher);
  const notes = data?.notes ?? [];

  async function togglePin(note: Note) {
    await apiMutate(`/api/notes/${note.id}`, "PATCH", { pinned: !note.pinned });
    mutate();
  }
  async function toggleFavorite(note: Note) {
    await apiMutate(`/api/notes/${note.id}`, "PATCH", { favorite: !note.favorite });
    mutate();
  }
  async function handleDelete(note: Note) {
    if (!confirm(`Delete "${note.title}"?`)) return;
    await apiMutate(`/api/notes/${note.id}`, "DELETE");
    toast.success("Note deleted");
    mutate();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
        <Button onClick={() => setNoteModalOpen(true)}>
          <Plus className="h-4 w-4" /> New note
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes…" className="pl-9" />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !notes.length && (
        <EmptyState
          icon="📝"
          title="No notes yet"
          description="Capture ideas, meeting notes, and checklists — link them to tasks or projects."
          action={
            <Button size="sm" onClick={() => setNoteModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> New note
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((n) => (
          <div key={n.id} className="card-surface p-4 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold truncate">{n.title}</h3>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => togglePin(n)} className={cn("h-6 w-6 rounded flex items-center justify-center hover:bg-surface-2", n.pinned && "text-accent")}>
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => toggleFavorite(n)} className={cn("h-6 w-6 rounded flex items-center justify-center hover:bg-surface-2", n.favorite && "text-warning")}>
                  <Star className="h-3.5 w-3.5" fill={n.favorite ? "currentColor" : "none"} />
                </button>
                <button onClick={() => handleDelete(n)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-danger/10 text-muted hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted whitespace-pre-wrap line-clamp-6 flex-1">{n.content}</p>
            <p className="text-[10px] text-muted mt-3">{new Date(n.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
