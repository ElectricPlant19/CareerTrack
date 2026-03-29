import React, { useState, useEffect } from 'react';
import { Task, Application, UserProfile } from '../types';
import { db, getDocs, query, collection, limit, handleFirestoreError, OperationType } from '../firebase';
import { createTask, updateTask, deleteTask } from '../services/taskService';
import { useToast } from '../contexts/ToastContext';
import { PRIORITY_COLORS } from '../constants';
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Circle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Edit2,
  X,
  ArrowUpDown
} from 'lucide-react';

type SortBy = 'priority' | 'dueDate' | 'application';

function getDueDateState(dueDate?: string): 'overdue' | 'today' | 'upcoming' | 'none' {
  if (!dueDate) return 'none';
  const due = new Date(dueDate);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  if (due < todayStart) return 'overdue';
  if (due >= todayStart && due < todayEnd) return 'today';
  return 'upcoming';
}

const PRIORITY_ORDER: Record<Task['priority'], number> = { High: 0, Medium: 1, Low: 2 };

export default function TaskList({ user }: { user: UserProfile }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAppId, setNewTaskAppId] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('Medium');

  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [showCompleted, setShowCompleted] = useState(false);

  // Inline edit state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editPriority, setEditPriority] = useState<Task['priority']>('Medium');
  const [editDueDate, setEditDueDate] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, `users/${user.uid}/tasks`), limit(200)));
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/tasks`);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, `users/${user.uid}/applications`), limit(100)));
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/applications`);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchApplications();
  }, [user.uid]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await createTask(user.uid, {
        title: newTaskTitle.trim(),
        applicationId: newTaskAppId || undefined,
        completed: false,
        priority: newTaskPriority,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
      });
      setNewTaskTitle('');
      setNewTaskAppId('');
      setNewTaskDueDate('');
      setNewTaskPriority('Medium');
      toast.success('Task added.');
      fetchTasks();
    } catch {
      toast.error('Failed to add task. Please try again.');
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      await updateTask(user.uid, task.id, { completed: !task.completed });
      fetchTasks();
    } catch {
      toast.error('Failed to update task.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(user.uid, id);
      fetchTasks();
    } catch {
      toast.error('Failed to delete task.');
    }
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
  };

  const saveEdit = async (taskId: string) => {
    try {
      await updateTask(user.uid, taskId, {
        priority: editPriority,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : undefined,
      });
      setEditingTaskId(null);
      fetchTasks();
    } catch {
      toast.error('Failed to update task.');
    }
  };

  const sortTasks = (taskList: Task[]): Task[] => {
    return [...taskList].sort((a, b) => {
      if (sortBy === 'priority') {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'application') {
        const appA = applications.find(ap => ap.id === a.applicationId)?.companyName || '';
        const appB = applications.find(ap => ap.id === b.applicationId)?.companyName || '';
        return appA.localeCompare(appB);
      }
      return 0;
    });
  };

  const activeTasks = sortTasks(tasks.filter(t => !t.completed));
  const completedTasks = tasks.filter(t => t.completed);
  const overdueTasks = activeTasks.filter(t => getDueDateState(t.dueDate) === 'overdue');

  const getPriorityColor = (priority: Task['priority']): string => {
    return PRIORITY_COLORS[priority] ?? 'text-gray-500 bg-gray-50';
  };

  const getDueDateLabel = (dueDate?: string) => {
    const state = getDueDateState(dueDate);
    if (state === 'none') return null;
    const date = new Date(dueDate!);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (state === 'overdue') return { label: `Overdue · ${label}`, className: 'text-red-600 bg-red-50' };
    if (state === 'today') return { label: `Due Today · ${label}`, className: 'text-amber-600 bg-amber-50' };
    return { label, className: 'text-gray-400 bg-gray-50' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Tasks & Reminders</h1>
          <button
            onClick={fetchTasks}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-gray-500 mt-1">Stay on top of your follow-ups and preparation tasks.</p>
      </div>

      {/* Add task form */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <CheckSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="What needs to be done?"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all font-medium text-sm"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus size={18} />
              Add Task
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="bg-gray-50 px-4 py-2.5 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium flex-1 min-w-[180px]"
              value={newTaskAppId}
              onChange={(e) => setNewTaskAppId(e.target.value)}
            >
              <option value="">Link to application (optional)</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.companyName} – {app.position}</option>
              ))}
            </select>
            <select
              className="bg-gray-50 px-4 py-2.5 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
            >
              <option value="High">High priority</option>
              <option value="Medium">Medium priority</option>
              <option value="Low">Low priority</option>
            </select>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-2xl text-sm font-medium">
              <Calendar size={16} className="text-gray-400" />
              <input
                type="date"
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-600"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                title="Due date (optional)"
              />
            </div>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-lg">Active Tasks</h3>
            <div className="flex items-center gap-3">
              {overdueTasks.length > 0 && (
                <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {overdueTasks.length} overdue
                </span>
              )}
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {activeTasks.length} Pending
              </span>
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-xl">
                <ArrowUpDown size={12} className="text-gray-400" />
                <select
                  className="bg-transparent border-none focus:ring-0 text-xs font-medium text-gray-600"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                >
                  <option value="priority">Priority</option>
                  <option value="dueDate">Due Date</option>
                  <option value="application">Application</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {activeTasks.map(task => {
              const app = applications.find(a => a.id === task.applicationId);
              const dueDateInfo = getDueDateLabel(task.dueDate);
              const isEditing = editingTaskId === task.id;
              const dueDateState = getDueDateState(task.dueDate);

              return (
                <div
                  key={task.id}
                  className={`group bg-white p-5 rounded-2xl border transition-all ${
                    dueDateState === 'overdue'
                      ? 'border-red-100 shadow-sm shadow-red-50'
                      : dueDateState === 'today'
                      ? 'border-amber-100 shadow-sm shadow-amber-50'
                      : 'border-gray-100 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button onClick={() => toggleTask(task)} className="text-gray-300 hover:text-black transition-colors mt-0.5">
                      <Circle size={22} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm">{task.title}</h4>
                      {app && (
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">
                          Linked to: <span className="text-gray-600">{app.companyName}</span>
                        </p>
                      )}
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2 mt-3">
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value as Task['priority'])}
                            className="bg-gray-50 border-none rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-black/5"
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="bg-gray-50 border-none rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-black/5"
                          />
                          <button
                            onClick={() => saveEdit(task.id)}
                            className="px-3 py-1.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTaskId(null)}
                            className="p-1.5 text-gray-400 hover:text-black rounded-xl"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        dueDateInfo && (
                          <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${dueDateInfo.className}`}>
                            <Calendar size={10} />
                            {dueDateInfo.label}
                          </span>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <button
                        onClick={() => startEdit(task)}
                        className="p-2 text-gray-300 hover:text-black opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-gray-50"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {activeTasks.length === 0 && !loading && (
              <div className="bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 py-12 text-center text-gray-400">
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-sm font-medium">All caught up! No pending tasks.</p>
              </div>
            )}
          </div>

          {/* Completed section */}
          <div className="pt-6">
            <button
              onClick={() => setShowCompleted(prev => !prev)}
              className="flex items-center gap-2 px-2 mb-4 hover:text-black text-gray-400 transition-colors"
            >
              {showCompleted ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <h3 className="font-bold text-lg">Completed</h3>
              <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-full">
                {completedTasks.length}
              </span>
            </button>
            {showCompleted && (
              <div className="space-y-3 opacity-60">
                {completedTasks.map(task => (
                  <div key={task.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <button onClick={() => toggleTask(task)} className="text-green-500">
                      <CheckCircle2 size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-through text-gray-400">{task.title}</h4>
                    </div>
                    <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-gray-300 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {completedTasks.length === 0 && (
                  <p className="text-sm text-gray-400 px-2">No completed tasks yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-black text-white p-8 rounded-[32px] shadow-xl shadow-black/10">
            <h3 className="text-xl font-bold mb-4">Productivity Tip</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Students who follow up within 48 hours of an interview are 3x more likely to move to the next round.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
              <AlertCircle size={14} />
              Set reminders now
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold mb-4">Task Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Completion Rate</span>
                <span className="text-sm font-bold">
                  {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-black h-full transition-all duration-500"
                  style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }}
                ></div>
              </div>
              {overdueTasks.length > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                  <span className="text-sm text-red-500 font-medium">Overdue</span>
                  <span className="text-sm font-bold text-red-500">{overdueTasks.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
