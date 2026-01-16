"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import type { AvailabilityWindow } from "@/features/scheduling";

import { AvailabilityForm } from "./availability-form";
import { AvailabilityGrid } from "./availability-grid";

interface AvailabilityPageClientProps {
  windows: AvailabilityWindow[];
}

export function AvailabilityPageClient({ windows }: AvailabilityPageClientProps) {
  const [editWindow, setEditWindow] = useState<AvailabilityWindow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAdd = useCallback(() => {
    setEditWindow(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((window: AvailabilityWindow) => {
    setEditWindow(window);
    setIsFormOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setEditWindow(null);
    setIsFormOpen(false);
  }, []);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={handleAdd}>+ Add Availability</Button>
      </div>
      <AvailabilityForm editWindow={editWindow} onClose={handleClose} open={isFormOpen} />
      <AvailabilityGrid windows={windows} onEdit={handleEdit} />
    </>
  );
}
