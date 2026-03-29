import React, { useState, useEffect } from 'react';
import { Interview, UserProfile, Application } from '../types';
import { db, getDocs, query, collection, limit, handleFirestoreError, OperationType } from '../firebase';
import { createInterview, updateInterview, deleteInterview } from '../services/interviewService';
import { useToast } from '../contexts/ToastContext';
import {
  Calendar as CalendarIcon,
  Clock,
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
  AlertTriangle,
  FileText,
  RefreshCw
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, differenceInMinutes } from 'date-fns';

function detectConflicts(interviews: Interview[]): Set<string> {
  const conflictIds = new Set<string>();
  const sorted = [...interviews].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const diff = Math.abs(differenceInMinutes(new Date(sorted[i].date), new Date(sorted[j].date)));
      if (diff < 60) {
        conflictIds.add(sorted[i].id);
        conflictIds.add(sorted[j].id);
      }
    }
  }
  return conflictIds;
}

export default function Calendar({ user }: { user: UserProfile }) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
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

  // Compute conflict IDs across all interviews
  const conflictIds = detectConflicts(interviews);

  const selectedDateInterviews = interviews.filter(i => isSameDay(new Date(i.date), selectedDate));

  const upcomingInterviews = interviews
    .filter(i => new Date(i.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const handleOpenCreate = () => {
    setEditingInterview(null);
    setSelectedInterview(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (interview: Interview) => {
    setEditingInterview(interview);
    setSelectedInterview(null);
    setIsModalOpen(true);
  };

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
          <button
            onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}
            className="px-4 font-bold text-sm min-w-[140px] text-center hover:text-gray-600 transition-colors"
          >
            {format(currentMonth, 'MMMM yyyy')}
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={handleOpenCreate}
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
          const hasConflict = dayInterviews.some(i => conflictIds.has(i.id));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={day.toString()}
              onClick={() => {
                setSelectedDate(day);
                setSelectedInterview(null);
              }}
              className={`min-h-[120px] bg-white p-3 transition-all cursor-pointer hover:bg-gray-50/50 ${!isCurrentMonth ? 'opacity-40' : ''} ${isSelected && !isToday ? 'bg-gray-50' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-black text-white' : isSelected ? 'ring-2 ring-black' : ''}`}>
                  {format(day, 'd')}
                </span>
                {hasConflict && (
                  <span title="Scheduling conflict" className="text-amber-500">
                    <AlertTriangle size={12} />
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {dayInterviews.map(interview => {
                  const app = applications.find(a => a.id === interview.applicationId);
                  const isConflict = conflictIds.has(interview.id);
                  return (
                    <div
                      key={interview.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedInterview(interview); setSelectedDate(day); }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold truncate transition-colors cursor-pointer ${
                        isConflict
                          ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                          : 'bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      {format(new Date(interview.date), 'HH:mm')} · {app?.companyName || 'Unknown'}
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

  const InterviewTypeIcon = ({ type }: { type: Interview['type'] }) => {
    if (type === 'Video Interview') return <Video size={14} className="text-indigo-500" />;
    if (type === 'Phone Screen') return <Phone size={14} className="text-green-500" />;
    return <User size={14} className="text-amber-500" />;
  };

  return (
    <div className="space-y-8">
      {renderHeader()}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        {renderDays()}
        {renderCells()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upcoming or Selected Date interviews */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          {selectedDateInterviews.length > 0 ? (
            <>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CalendarIcon size={20} className="text-indigo-500" />
                {format(selectedDate, 'MMMM d')} · {selectedDateInterviews.length} Interview{selectedDateInterviews.length > 1 ? 's' : ''}
              </h3>
              <div className="space-y-4">
                {selectedDateInterviews.map(interview => {
                  const app = applications.find(a => a.id === interview.applicationId);
                  const isConflict = conflictIds.has(interview.id);
                  return (
                    <div
                      key={interview.id}
                      onClick={() => setSelectedInterview(interview)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedInterview?.id === interview.id
                          ? 'border-black bg-gray-50'
                          : isConflict
                          ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                          : 'border-gray-100 bg-gray-50 hover:border-indigo-200'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex flex-col items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase">{format(new Date(interview.date), 'MMM')}</span>
                        <span className="text-lg font-bold leading-none">{format(new Date(interview.date), 'd')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{app?.position} @ {app?.companyName || 'Unknown'}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {format(new Date(interview.date), 'HH:mm')}
                          </span>
                          <span className="flex items-center gap-1">
                            <InterviewTypeIcon type={interview.type} />
                            {interview.type}
                          </span>
                          {isConflict && (
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <AlertTriangle size={10} />
                              Conflict
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock size={20} className="text-indigo-500" />
                Upcoming Interviews
              </h3>
              <div className="space-y-4">
                {upcomingInterviews.map(interview => {
                  const app = applications.find(a => a.id === interview.applicationId);
                  const isConflict = conflictIds.has(interview.id);
                  return (
                    <div
                      key={interview.id}
                      onClick={() => setSelectedInterview(interview)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all group ${
                        selectedInterview?.id === interview.id
                          ? 'border-black bg-gray-50'
                          : isConflict
                          ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                          : 'border-gray-100 bg-gray-50 hover:border-indigo-200'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex flex-col items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase">{format(new Date(interview.date), 'MMM')}</span>
                        <span className="text-lg font-bold leading-none">{format(new Date(interview.date), 'd')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{app?.position} @ {app?.companyName}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(interview.date), 'HH:mm')}</span>
                          <span className="flex items-center gap-1">
                            <InterviewTypeIcon type={interview.type} />
                            {interview.type}
                          </span>
                          {isConflict && (
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <AlertTriangle size={10} />
                              Conflict
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(interview); }}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white rounded-lg transition-all"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  );
                })}
                {upcomingInterviews.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <CalendarIcon size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No upcoming interviews.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: Interview details panel */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          {selectedInterview ? (
            <InterviewDetailsPanel
              interview={selectedInterview}
              application={applications.find(a => a.id === selectedInterview.applicationId)}
              onEdit={() => handleOpenEdit(selectedInterview)}
              onClose={() => setSelectedInterview(null)}
            />
          ) : (
            <>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText size={20} className="text-green-500" />
                Preparation Notes
              </h3>
              <div className="bg-gray-50 rounded-2xl p-6 min-h-[200px] flex flex-col items-center justify-center text-center">
                <CalendarIcon size={32} className="text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                  Click an interview on the calendar or in the upcoming list to view preparation notes, questions, and feedback.
                </p>
              </div>
            </>
          )}
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

const InterviewDetailsPanel = ({
  interview,
  application,
  onEdit,
  onClose
}: {
  interview: Interview;
  application: Application | undefined;
  onEdit: () => void;
  onClose: () => void;
}) => {
  const TypeIcon = interview.type === 'Video Interview'
    ? Video
    : interview.type === 'Phone Screen'
    ? Phone
    : User;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Interview Details</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all"
          >
            Edit
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        <p className="font-bold text-sm">{application?.position} @ {application?.companyName || 'Unknown'}</p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {format(new Date(interview.date), 'MMM d, yyyy · HH:mm')}
          </span>
          <span className="flex items-center gap-1">
            <TypeIcon size={12} />
            {interview.type}
          </span>
        </div>
        {interview.outcome && (
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600">
            {interview.outcome}
          </span>
        )}
      </div>
      {interview.notes && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Preparation Notes</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-2xl p-4 leading-relaxed whitespace-pre-line">{interview.notes}</p>
        </div>
      )}
      {interview.questions && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Questions to Ask</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-2xl p-4 leading-relaxed whitespace-pre-line">{interview.questions}</p>
        </div>
      )}
      {interview.feedback && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Feedback</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-2xl p-4 leading-relaxed whitespace-pre-line">{interview.feedback}</p>
        </div>
      )}
      {!interview.notes && !interview.questions && !interview.feedback && (
        <p className="text-sm text-gray-400 text-center py-4">No preparation notes yet. Click Edit to add them.</p>
      )}
    </div>
  );
};

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
                <label className="text-sm font-bold text-gray-700">Feedback</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all min-h-[100px]"
                  value={formData.feedback}
                  onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="How did it go?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Outcome</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={formData.outcome}
                  onChange={e => setFormData({ ...formData, outcome: e.target.value })}
                >
                  <option value="">Select outcome</option>
                  <option value="Moved to next round">Moved to next round</option>
                  <option value="Offer received">Offer received</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pending decision">Pending decision</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
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
