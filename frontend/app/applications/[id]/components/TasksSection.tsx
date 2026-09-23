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
  Clock,
  Flag,
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

    const created = addApplicationTask(applicationId, newTaskTitle, priority, dueDate);
    setTasks(getApplicationTasks(applicationId));
    setNewTaskTitle('');
    setDueDate('');
    setShowAddForm(false);
    showToast('Task added to checklist!', 'success');
  };

  const handleToggle = (taskId: string) => {
    const updated = toggleTaskCompletion(applicationId, taskId);
    setTasks(updated);
    const target = updated.find((t) => t.id === taskId);
    if (target?.completed) {
      showToast('Task completed! 🎉', 'success');
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ListTodo className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Action Items & Checklist
          </h2>
          {totalCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              {completedCount} / {totalCount}
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

      {/* Progress Bar (when tasks exist) */}
      {totalCount > 0 && (
        <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold">
            <span>Checklist Progress</span>
            <span className="text-emerald-600 dark:text-emerald-400">{progressPct}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Add Form */}
      {showAddForm && (
        <form onSubmit={handleCreateTask} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-150">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Description *
            </label>
            <input
              type="text"
              placeholder="e.g. Send follow-up email, complete take-home assessment, review mock questions..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="HIGH">High Priority (Urgent)</option>
                <option value="MEDIUM">Medium Priority (Standard)</option>
                <option value="LOW">Low Priority (Optional)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Save Item
            </Button>
          </div>
        </form>
      )}

      {/* Preset Action Pills */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Quick Preset Actions:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TASK_TEMPLATES.slice(0, 4).map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAddPreset(tpl)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 transition-colors text-left"
            >
              + {tpl.title.length > 38 ? `${tpl.title.substring(0, 38)}...` : tpl.title}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2 pt-1">
        {tasks.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400">
            No action items logged yet. Add your first task above to stay on top of interview prep and follow-ups!
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                task.completed
                  ? 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start gap-2.5 flex-1 cursor-pointer select-none" onClick={() => handleToggle(task.id)}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(task.id);
                  }}
                  className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                <div className="space-y-1 flex-1">
                  <span
                    className={`text-xs font-medium block leading-snug ${
                      task.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {task.title}
                  </span>

                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    {/* Priority Badge */}
                    <span
                      className={`px-1.5 py-0.2 rounded font-semibold ${
                        task.priority === 'HIGH'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : task.priority === 'MEDIUM'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {task.priority}
                    </span>

                    {/* Due Date */}
                    {task.due_date && (
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(task.id)}
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition-colors"
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
