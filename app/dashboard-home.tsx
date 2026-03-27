"use client";

import { TopBar } from "@/components/dashboard/top-bar";
import { QuadrantGrid } from "@/components/dashboard/quadrant-grid";
import { FoodQuadrant } from "@/components/dashboard/food-quadrant";
import { NotesQuadrant } from "@/components/dashboard/notes-quadrant";
import { LibraryQuadrant } from "@/components/dashboard/library-quadrant";

export function DashboardHome() {
  return (
    <div className="flex min-h-dvh flex-col md:h-dvh md:overflow-hidden">
      <TopBar />
      <QuadrantGrid>
        <NotesQuadrant />
        <LibraryQuadrant />
        <FoodQuadrant />
      </QuadrantGrid>
    </div>
  );
}
