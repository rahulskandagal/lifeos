"use client";

import { useEffect, useState } from "react";

export function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);
  return now;
}

export function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

const MOTIVATION = [
  "Small steps every day lead to big results.",
  "Discipline is choosing between what you want now and what you want most.",
  "Progress, not perfection.",
  "Your future self is built by what you do today.",
  "Focus on being productive instead of busy.",
  "The secret of getting ahead is getting started.",
  "Consistency beats intensity.",
  "Done is better than perfect.",
];

export function motivationalMessage(date: Date): string {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  return MOTIVATION[dayOfYear % MOTIVATION.length];
}
