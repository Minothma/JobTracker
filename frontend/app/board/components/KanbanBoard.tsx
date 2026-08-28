'use client';

import React from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import { Application, ApplicationStatus } from '../../../lib/types';
import { KanbanColumn } from './KanbanColumn';
import { apiFetch } from '../../../lib/api-client';
import { useToast } from '../../../components/ui/Toast';

interface KanbanBoardProps {
  applications: Application[];
  onApplicationsChange: React.Dispatch<React.SetStateAction<Application[]>>;
}

const COLUMNS: { status: ApplicationStatus; title: string }[] = [
  { status: 'APPLIED', title: 'Applied' },
  { status: 'INTERVIEW', title: 'Interview' },
  { status: 'OFFER', title: 'Offer' },
  { status: 'REJECTED', title: 'Rejected' },
  { status: 'WITHDRAWN', title: 'Withdrawn' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onApplicationsChange,
}) => {
  const { showToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag begins
      },
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const applicationId = active.id as string;
    const targetStatus = over.id as ApplicationStatus;

    // Find current application
    const currentApp = applications.find((app) => app.id === applicationId);
    if (!currentApp || currentApp.status === targetStatus) {
      return;
    }

    const previousStatus = currentApp.status;

    // 1. Optimistic UI update
    onApplicationsChange((prevApps) =>
      prevApps.map((app) =>
        app.id === applicationId
          ? { ...app, status: targetStatus, updated_at: new Date().toISOString() }
          : app,
      ),
    );

    // 2. Persist to API
    try {
      await apiFetch<Application>(`/applications/${applicationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus }),
      });
    } catch (err: any) {
      // 3. Rollback on failure & show error message
      onApplicationsChange((prevApps) =>
        prevApps.map((app) =>
          app.id === applicationId ? { ...app, status: previousStatus } : app,
        ),
      );
      showToast(`Failed to update status for ${currentApp.company_name}. Reverting.`, 'error');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start min-h-[600px] overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const columnApps = applications.filter((app) => app.status === col.status);
          return (
            <KanbanColumn
              key={col.status}
              status={col.status}
              title={col.title}
              applications={columnApps}
            />
          );
        })}
      </div>
    </DndContext>
  );
};
