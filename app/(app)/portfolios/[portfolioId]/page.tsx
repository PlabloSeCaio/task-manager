"use client";

import { useParams } from "next/navigation";

export default function PortfolioDetailPage() {
  const params = useParams();

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">
        Portfolio detail coming in Phase 4
      </p>
    </div>
  );
}
