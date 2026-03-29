import React, { useState, useEffect } from 'react';
import { Interview, UserProfile, Application } from '../types';
import { db, getDocs, query, collection, limit, handleFirestoreError, OperationType } from '../firebase';
import { createInterview, updateInterview, deleteInterview } from '../services/interviewService';
import { useToast } from '../contexts/ToastContext';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  Video,
  Phone,
  User,
  X,
  Save,
  MoreVertical,
  Trash2,
  CheckSquare,
  RefreshCw
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export default function Calendar({ user }: { user: UserProfile }) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, `users/${user.uid}/interviews`), limit(100)));
      setInterviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/interviews`);
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
    fetchInterviews();
    fetchApplications();
  }, [user.uid]);

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Interview Calendar</h1>
          <button
            onClick={fetchInterviews}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-gray-500 mt-1">Manage your interview schedule and preparation.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 font-bold text-sm min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={() => { setEditingInterview(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-semibold hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
        >
          <Plus size={20} />
          Schedule Interview
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map(day => (
          <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        {calendarDays.map(day => {
          const dayInterviews = interviews.filter(i => isSameDay(new Date(i.date), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              className={`min-h-[120px] bg-white p-3 transition-all cursor-pointer hover:bg-gray-50/50 ${!isCurrentMonth ? 'opacity-40' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-black text-white' : isSelected ? 'bg-gray-100' : ''}`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1">
                {dayInterviews.map(interview => {
                  const app = applications.find(a => a.id === interview.applicationId);
                  return (
                    <div
                      key={interview.id}
                      onClick={(e) => { e.stopPropagation(); setEditingInterview(interview); setIsModalOpen(true); }}
                      className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold truncate hover:bg-indigo-100 transition-colors"
                    >
                      {format(new Date(interview.date), 'HH:mm')} - {app?.companyName || 'Unknown'}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderHeader()}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        {renderDays()}
        {renderCells()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock size={20} className="text-indigo-500" />
            Upcoming Interviews
          </h3>
          <div className="space-y-4">
            {interviews
              .filter(i => new Date(i.date) >= new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 5)
              .map(interview => {
                const app = applications.find(a => a.id === interview.applicationId);
                return (
                  <div key={interview.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex flex-col items-center justify-center shadow-sm">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase">{format(new Date(interview.date), 'MMM')}</span>
                      <span className="text-lg font-bold leading-none">{format(new Date(interview.date), 'd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{app?.position} @ {app?.companyName}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(interview.date), 'HH:mm')}</span>
                        <span className="flex items-center gap-1">
                          {interview.type === 'Video Interview' ? <Video size={12} /> : interview.type === 'Phone Screen' ? <Phone size={12} /> : <User size={12} />}
                          {interview.type}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setEditingInterview(interview); setIsModalOpen(true); }}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white rounded-lg transition-all"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                );
              })}
            {interviews.filter(i => new Date(i.date) >= new Date()).length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <CalendarIcon size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No upcoming interviews.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CheckSquare size={20} className="text-green-500" />
            Preparation Notes
          </h3>
          <div className="bg-gray-50 rounded-2xl p-6 min-h-[200px] flex flex-col items-center justify-center text-center">
            <p className="text-gray-500 text-sm mb-4 leading-relaxed">
              Select an interview from the calendar or list to view and edit preparation notes, questions, and feedback.
            </p>
            <button className="text-sm font-bold text-black underline underline-offset-4 hover:text-gray-600 transition-colors">
              View all preparation materials
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <InterviewModal
          user={user}
          applications={applications}
          onClose={() => { setIsModalOpen(false); setEditingInterview(null); fetchInterviews(); }}
          editingInterview={editingInterview}
        />
      )}
    </div>
  );
}

const InterviewModal = ({ user, applications, onClose, editingInterview }: { user: UserProfile, applications: Application[], onClose: () => void, editingInterview: Interview | null }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    applicationId: editingInterview?.applicationId || '',
    type: (editingInterview?.type ?? 'Video Interview') as Interview['type'],
    date: editingInterview?.date ? new Date(editingInterview.date).toISOString().slice(0, 16) : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: editingInterview?.notes || '',
    questions: editingInterview?.questions || '',
    feedback: editingInterview?.feedback || '',
    outcome: editingInterview?.outcome || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        date: new Date(formData.date).toISOString(),
      };

      if (editingInterview) {
        await updateInterview(user.uid, editingInterview.id, data);
        toast.success('Interview updated.');
      } else {
        await createInterview(user.uid, data);
        toast.success('Interview scheduled.');
      }
      onClose();
    } catch {
      toast.error('Failed to save interview. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (editingInterview && window.confirm('Delete this interview?')) {
      try {
        await deleteInterview(user.uid, editingInterview.id);
        toast.success('Interview deleted.');
        onClose();
      } catch {
        toast.error('Failed to delete interview.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-bold tracking-tight">
            {editingInterview ? 'Edit Interview' : 'Schedule Interview'}
          </h2>
          <div className="flex items-center gap-2">
            {editingInterview && (
              <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <Trash2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Application *</label>
              <select
                required
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={formData.applicationId}
                onChange={e => setFormData({ ...formData, applicationId: e.target.value })}
              >
                <option value="">Select an application</option>
                {applications.map(app => (
                  <option key={app.id} value={app.id}>{app.position} @ {app.companyName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Interview Type</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as Interview['type'] })}
              >
                <option value="Phone Screen">Phone Screen</option>
                <option value="Video Interview">Video Interview</option>
                <option value="In-person">In-person</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-gray-700">Date & Time *</label>
              <input
                required
                type="datetime-local"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Preparation Notes</label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all min-h-[100px]"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Research, key points to mention..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Questions to Ask</label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all min-h-[100px]"
              value={formData.questions}
              onChange={e => setFormData({ ...formData, questions: e.target.value })}
              placeholder="What questions do you have for the interviewer?"
            />
          </div>

          {editingInterview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Feedback / Outcome</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all min-h-[100px]"
                  value={formData.feedback}
                  onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="How did it go?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Outcome Status</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={formData.outcome}
                  onChange={e => setFormData({ ...formData, outcome: e.target.value })}
                  placeholder="e.g. Moved to next round, Rejected"
                />
              </div>
            </div>
          )}

          <div className="pt-4 sticky bottom-0 bg-white pb-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
            >
              <Save size={20} />
              {editingInterview ? 'Update Schedule' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
