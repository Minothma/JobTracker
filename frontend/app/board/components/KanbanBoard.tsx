'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Application, ApplicationStatus } from '../../../lib/types';
import { KanbanColumn } from './KanbanColumn';
import { ApplicationCard } from './ApplicationCard';
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
  const [activeApp, setActiveApp] = useState<Application | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag begins
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const found = applications.find((app) => app.id === active.id);
    if (found) {
      setActiveApp(found);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeItem = applications.find((app) => app.id === activeId);
    if (!activeItem) return;

    // Check if over is a column container
    const isOverColumn = COLUMNS.some((c) => c.status === overId);
    const targetStatus = isOverColumn
      ? (overId as ApplicationStatus)
      : applications.find((app) => app.id === overId)?.status;

    if (!targetStatus) return;

    // If moving between columns
    if (activeItem.status !== targetStatus) {
      onApplicationsChange((items) => {
        const activeIndex = items.findIndex((i) => i.id === activeId);
        const overIndex = items.findIndex((i) => i.id === overId);

        const updated = [...items];
        updated[activeIndex] = {
          ...updated[activeIndex],
          status: targetStatus,
          updated_at: new Date().toISOString(),
        };

        return arrayMove(
          updated,
          activeIndex,
          overIndex >= 0 ? overIndex : activeIndex,
        );
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveApp(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentApp = applications.find((app) => app.id === activeId);
    if (!currentApp) return;

    // Check if reordering within column or dropped over container
    const isOverColumn = COLUMNS.some((c) => c.status === overId);
    const targetStatus = isOverColumn
      ? (overId as ApplicationStatus)
      : applications.find((app) => app.id === overId)?.status || currentApp.status;

    const activeIndex = applications.findIndex((i) => i.id === activeId);
    const overIndex = applications.findIndex((i) => i.id === overId);

    if (activeIndex !== overIndex && overIndex >= 0) {
      onApplicationsChange((items) => arrayMove(items, activeIndex, overIndex));
    }

    // Persist status change if changed
    if (currentApp.status !== targetStatus) {
      const prevStatus = currentApp.status;
      onApplicationsChange((prev) =>
        prev.map((app) =>
          app.id === activeId ? { ...app, status: targetStatus } : app,
        ),
      );

      try {
        await apiFetch<Application>(`/applications/${activeId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: targetStatus }),
        });
      } catch {
        onApplicationsChange((prev) =>
          prev.map((app) =>
            app.id === activeId ? { ...app, status: prevStatus } : app,
          ),
        );
        showToast(`Failed to move ${currentApp.company_name}. Reverting.`, 'error');
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start min-h-[600px] overflow-x-auto pb-6">
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

      {/* Floating Drag Overlay */}
      <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
        {activeApp ? <ApplicationCard application={activeApp} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};
