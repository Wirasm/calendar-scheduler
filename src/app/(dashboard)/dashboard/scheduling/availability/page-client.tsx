"use client";

import { useState } from "react";

import type { AvailabilityWindow } from "@/features/scheduling";

import { AvailabilityForm } from "./availability-form";
import { AvailabilityGrid } from "./availability-grid";

interface AvailabilityPageClientProps {
  windows: AvailabilityWindow[];
}

export function AvailabilityPageClient({ windows }: AvailabilityPageClientProps) {
  const [editWindow, setEditWindow] = useState<AvailabilityWindow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (window: AvailabilityWindow) => {
    setEditWindow(window);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setEditWindow(null);
    setIsFormOpen(false);
  };

  return (
    <>
      <div className="flex justify-end">
        <AvailabilityForm editWindow={editWindow} onClose={handleClose} open={isFormOpen} />
      </div>
      <AvailabilityGrid windows={windows} onEdit={handleEdit} />
    </>
  );
}
