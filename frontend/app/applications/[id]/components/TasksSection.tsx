'use client';

import React, { useState, useEffect } from 'react';
import {
  ApplicationTask,
  TaskPriority,
  PRESET_TASK_TEMPLATES,
  getApplicationTasks,
  addApplicationTask,
  toggleTaskCompletion,
  deleteApplicationTask,
  TASKS_CHANGED_EVENT,
} from '../../../../lib/tasks';
import { Button } from '../../../../components/ui/Button';
import { useToast } from '../../../../components/ui/Toast';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ListTodo,
  CheckCircle2,
} from 'lucide-react';

interface TasksSectionProps {
  applicationId: string;
  companyName?: string;
  roleTitle?: string;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  applicationId,
  companyName = 'Company',
  roleTitle = 'Position',
}) => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<ApplicationTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setTasks(getApplicationTasks(applicationId));

    const handleTasksChanged = (e: any) => {
      if (e.detail?.applicationId === applicationId) {
        setTasks(getApplicationTasks(applicationId));
      }
    };

    window.addEventListener(TASKS_CHANGED_EVENT, handleTasksChanged);
    return () => {
      window.removeEventListener(TASKS_CHANGED_EVENT, handleTasksChanged);
    };
  }, [applicationId]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addApplicationTask(applicationId, newTaskTitle, priority, dueDate);
    setTasks(getApplicationTasks(applicationId));
    setNewTaskTitle('');
    setDueDate('');
    setShowAddForm(false);
    showToast('Task added to checklist', 'success');
  };

  const handleToggle = (taskId: string) => {
    const updated = toggleTaskCompletion(applicationId, taskId);
    setTasks(updated);
    const target = updated.find((t) => t.id === taskId);
    if (target?.completed) {
      showToast('Task completed', 'success');
    }
  };

  const handleDelete = (taskId: string) => {
    const updated = deleteApplicationTask(applicationId, taskId);
    setTasks(updated);
    showToast('Task removed', 'info');
  };

  const handleAddPreset = (template: { title: string; priority: TaskPriority; daysOffset?: number }) => {
    let dateStr = '';
    if (template.daysOffset) {
      const d = new Date();
      d.setDate(d.getDate() + template.daysOffset);
      dateStr = d.toISOString().split('T')[0];
    }

    addApplicationTask(applicationId, template.title, template.priority, dateStr);
    setTasks(getApplicationTasks(applicationId));
    showToast('Action item added from template', 'success');
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-lg p-5 space-y-4 text-[#FAFAFA]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#18181B] text-indigo-400 border border-[#27272A]">
            <ListTodo className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-[#FAFAFA]">
            Checklist & Tasks
          </h2>
          {totalCount > 0 && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-[#71717A]">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>

        <Button
          size="sm"
          variant={showAddForm ? 'outline' : 'primary'}
          onClick={() => setShowAddForm((prev) => !prev)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>{showAddForm ? 'Cancel' : 'Add Task'}</span>
        </Button>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-1.5 bg-[#0E0E10] p-3 rounded-lg border border-[#27272A]">
          <div className="flex items-center justify-between text-xs font-mono text-[#71717A]">
            <span>Progress</span>
            <span className="text-emerald-400 font-semibold">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-[#18181B] rounded-full overflow-hidden border border-[#27272A]">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Add Form */}
      {showAddForm && (
        <form onSubmit={handleCreateTask} className="p-3.5 rounded-lg bg-[#0E0E10] border border-[#27272A] space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
              Task Description *
            </label>
            <input
              type="text"
              placeholder="e.g. Send thank you note, finish take-home..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full text-xs px-2.5 py-1.5 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="HIGH">High (Urgent)</option>
                <option value="MEDIUM">Medium (Normal)</option>
                <option value="LOW">Low (Optional)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D4D4D8] mb-1">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded bg-[#0A0A0B] border border-[#27272A] text-[#FAFAFA] focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Save
            </Button>
          </div>
        </form>
      )}

      {/* Preset Action Pills */}
      <div className="space-y-1.5 font-mono text-xs">
        <span className="text-[11px] text-[#71717A] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          templates:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TASK_TEMPLATES.slice(0, 4).map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAddPreset(tpl)}
              className="text-[11px] px-2 py-0.5 rounded bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A] transition-colors"
            >
              + {tpl.title.length > 35 ? `${tpl.title.substring(0, 35)}...` : tpl.title}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2 pt-1">
        {tasks.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-[#27272A] rounded-lg text-xs font-mono text-[#52525B]">
            No checklist items logged. Add a task to track prep steps.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-2.5 rounded-md border transition-colors flex items-start justify-between gap-2.5 ${
                task.completed
                  ? 'bg-[#0E0E10] border-[#27272A] opacity-50'
                  : 'bg-[#0E0E10] border-[#27272A] hover:border-[#3F3F46]'
              }`}
            >
              <div className="flex items-start gap-2.5 flex-1 cursor-pointer select-none" onClick={() => handleToggle(task.id)}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(task.id);
                  }}
                  className="mt-0.5 text-[#52525B] hover:text-emerald-400 transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-[#52525B]" />
                  )}
                </button>

                <div className="space-y-1 flex-1">
                  <span
                    className={`text-xs font-medium block leading-snug ${
                      task.completed
                        ? 'line-through text-[#52525B]'
                        : 'text-[#FAFAFA]'
                    }`}
                  >
                    {task.title}
                  </span>

                  <div className="flex items-center gap-2 flex-wrap font-mono text-[10px]">
                    <span
                      className={`px-1 py-0.2 rounded border ${
                        task.priority === 'HIGH'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                          : task.priority === 'MEDIUM'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          : 'bg-[#18181B] text-[#71717A] border-[#27272A]'
                      }`}
                    >
                      {task.priority.toLowerCase()}
                    </span>

                    {task.due_date && (
                      <span className="flex items-center gap-1 text-[#71717A]">
                        <Calendar className="w-3 h-3 text-[#52525B]" />
                        <span>due {task.due_date}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(task.id)}
                className="text-[#52525B] hover:text-rose-400 p-1 rounded transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
