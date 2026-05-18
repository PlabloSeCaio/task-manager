"use client";

import { useState, useCallback } from "react";

export function useDragDrop(onMove: (taskId: string, sectionId: string | null, position: number) => void) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleDragEnd = useCallback(
    (taskId: string, overId: string | null) => {
      setActiveId(null);
      if (!overId || taskId === overId) return;
      onMove(taskId, overId, 0);
    },
    [onMove]
  );

  return { activeId, handleDragStart, handleDragEnd };
}
