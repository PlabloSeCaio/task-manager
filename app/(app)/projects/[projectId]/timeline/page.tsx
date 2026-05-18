"use client";

import { useParams } from "next/navigation";

export default function TimelineViewPage() {
  const params = useParams();

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">
        Timeline view coming in Phase 2
      </p>
    </div>
  );
}
