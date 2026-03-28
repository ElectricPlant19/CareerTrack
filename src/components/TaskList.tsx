import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { Task, UserProfile, Application } from '../types';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Calendar, 
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  Circle
} from 'lucide-react';

export default function TaskList({ user }: { user: UserProfile }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedAppId, setSelectedAppId] = useState('');

  useEffect(() => {
    const qTasks = query(collection(db, `users/${user.uid}/tasks`));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      setLoading(false);
    });

    const qApps = query(collection(db, `users/${user.uid}/applications`));
    const unsubscribeApps = onSnapshot(qApps, (snapshot) => {
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    });

    return () => {
      unsubscribeTasks();
      unsubscribeApps();
    };
  }, [user.uid]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await addDoc(collection(db, `users/${user.uid}/tasks`), {
        title: newTaskTitle,
        applicationId: selectedAppId || null,
        completed: false,
        priority: 'Medium',
        dueDate: new Date().toISOString()
      });
      setNewTaskTitle('');
      setSelectedAppId('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/tasks`);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      await updateDoc(doc(db, `users/${user.uid}/tasks`, task.id), {
        title: task.title,
        completed: !task.completed
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/tasks/${task.id}`);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, `users/${user.uid}/tasks`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/tasks/${id}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-500 bg-red-50';
      case 'Medium': return 'text-amber-500 bg-amber-50';
      case 'Low': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks & Reminders</h1>
        <p className="text-gray-500 mt-1">Stay on top of your follow-ups and preparation tasks.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <CheckSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="What needs to be done? (e.g. Follow up with recruiter)" 
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all font-medium"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
          </div>
          <select 
            className="bg-gray-50 px-4 py-4 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium min-w-[200px]"
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
          >
            <option value="">Link to application (optional)</option>
            {applications.map(app => (
              <option key={app.id} value={app.id}>{app.companyName} - {app.position}</option>
            ))}
          </select>
          <button 
            type="submit"
            className="bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add Task
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-lg">Active Tasks</h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {tasks.filter(t => !t.completed).length} Pending
            </span>
          </div>
          
          <div className="space-y-3">
            {tasks
              .filter(t => !t.completed)
              .sort((a, b) => (a.priority === 'High' ? -1 : 1))
              .map(task => {
                const app = applications.find(a => a.id === task.applicationId);
                return (
                  <div key={task.id} className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                    <button onClick={() => toggleTask(task)} className="text-gray-300 hover:text-black transition-colors">
                      <Circle size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm">{task.title}</h4>
                      {app && (
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">
                          Linked to: <span className="text-gray-600">{app.companyName}</span>
                        </p>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            {tasks.filter(t => !t.completed).length === 0 && !loading && (
              <div className="bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 py-12 text-center text-gray-400">
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-sm font-medium">All caught up! No pending tasks.</p>
              </div>
            )}
          </div>

          <div className="pt-8">
            <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="font-bold text-lg text-gray-400">Completed</h3>
            </div>
            <div className="space-y-3 opacity-60">
              {tasks
                .filter(t => t.completed)
                .map(task => (
                  <div key={task.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <button onClick={() => toggleTask(task)} className="text-green-500">
                      <CheckCircle2 size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-through text-gray-400">{task.title}</h4>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-300 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
            </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
