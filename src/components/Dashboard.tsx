import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, where, handleFirestoreError, OperationType } from '../firebase';
import { Application, UserProfile, ApplicationStatus } from '../types';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  BarChart3, 
  PieChart as PieChartIcon,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import KanbanBoard from './KanbanBoard';

const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string, value: number | string, icon: any, color: string, trend?: { value: string, up: boolean } }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trend.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend.value}
        </div>
      )}
    </div>
    <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold tracking-tight">{value}</p>
  </div>
);

export default function Dashboard({ user }: { user: UserProfile }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'overview'>('kanban');

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status !== 'Bookmarked' && a.status !== 'Archived').length,
    interviews: applications.filter(a => a.status === 'Interview' || a.status === 'Phone Screen').length,
    offers: applications.filter(a => a.status === 'Offer').length,
    rejections: applications.filter(a => a.status === 'Rejected').length,
  };

  // Calculate time-based stats for trend comparison using applicationDate
  const now = Date.now();
  const last30Days = applications.filter(a => a.applicationDate && (now - new Date(a.applicationDate).getTime()) / (1000 * 60 * 60 * 24) <= 30);
  const previous30Days = applications.filter(a => a.applicationDate && (now - new Date(a.applicationDate).getTime()) / (1000 * 60 * 60 * 24) > 30 && (now - new Date(a.applicationDate).getTime()) / (1000 * 60 * 60 * 24) <= 60);

  const currentTotal = last30Days.length;
  const previousTotal = previous30Days.length;
  const totalTrend = previousTotal > 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100) : 0;

  const currentInterviews = last30Days.filter(a => a.status === 'Interview' || a.status === 'Phone Screen').length;
  const previousInterviews = previous30Days.filter(a => a.status === 'Interview' || a.status === 'Phone Screen').length;
  const interviewTrend = previousInterviews > 0 ? Math.round(((currentInterviews - previousInterviews) / previousInterviews) * 100) : 0;

  const currentOffers = last30Days.filter(a => a.status === 'Offer').length;
  const previousOffers = previous30Days.filter(a => a.status === 'Offer').length;
  const offersTrend = previousOffers > 0 ? Math.round(((currentOffers - previousOffers) / previousOffers) * 100) : 0;

  const currentConversion = stats.applied > 0 ? (stats.offers / stats.applied) * 100 : 0;
  const prevApplied = previous30Days.filter(a => a.status !== 'Bookmarked' && a.status !== 'Archived').length;
  const previousConversion = prevApplied > 0 ? (previousOffers / prevApplied) * 100 : 0;
  const conversionTrend = previousConversion > 0 ? Math.round(((currentConversion - previousConversion) / previousConversion) * 100) : 0;

  useEffect(() => {
    const q = query(collection(db, `users/${user.uid}/applications`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      setApplications(apps);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/applications`);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const conversionRate = stats.applied > 0 ? ((stats.offers / stats.applied) * 100).toFixed(1) : '0';
  const interviewRate = stats.applied > 0 ? ((stats.interviews / stats.applied) * 100).toFixed(1) : '0';

  // Chart Data
  const sourceData = Object.entries(
    applications.reduce((acc, app) => {
      const source = app.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const statusData = [
    { name: 'Applied', value: applications.filter(a => a.status === 'Applied').length },
    { name: 'Interview', value: applications.filter(a => ['Phone Screen', 'Interview'].includes(a.status)).length },
    { name: 'Offer', value: applications.filter(a => a.status === 'Offer').length },
    { name: 'Rejected', value: applications.filter(a => a.status === 'Rejected').length },
  ];

  const COLORS = ['#000000', '#6366F1', '#10B981', '#EF4444', '#F59E0B'];

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100"></div>)}
    </div>
    <div className="h-96 bg-white rounded-3xl border border-gray-100"></div>
  </div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline Dashboard</h1>
          <p className="text-gray-500 mt-1">Track your progress and application funnel metrics.</p>
        </div>
        <div className="flex items-center bg-white p-1 rounded-2xl border border-gray-100 shadow-sm self-start">
          <button 
            onClick={() => setView('kanban')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === 'kanban' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-gray-500 hover:text-black'}`}
          >
            Kanban Board
          </button>
          <button 
            onClick={() => setView('overview')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === 'overview' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-gray-500 hover:text-black'}`}
          >
            Analytics Overview
          </button>
        </div>
      </div>

      {view === 'overview' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Applications"
              value={stats.total}
              icon={Briefcase}
              color="bg-blue-500"
              trend={totalTrend !== 0 ? { value: `${totalTrend > 0 ? '+' : ''}${totalTrend}%`, up: totalTrend > 0 } : undefined}
            />
            <StatCard
              title="Interview Rate"
              value={`${interviewRate}%`}
              icon={TrendingUp}
              color="bg-indigo-500"
              trend={interviewTrend !== 0 ? { value: `${interviewTrend > 0 ? '+' : ''}${interviewTrend}%`, up: interviewTrend > 0 } : undefined}
            />
            <StatCard
              title="Offers Received"
              value={stats.offers}
              icon={CheckCircle2}
              color="bg-green-500"
              trend={offersTrend !== 0 ? { value: `${offersTrend > 0 ? '+' : ''}${offersTrend}%`, up: offersTrend > 0 } : undefined}
            />
            <StatCard
              title="Conversion Rate"
              value={`${conversionRate}%`}
              icon={BarChart3}
              color="bg-amber-500"
              trend={conversionTrend !== 0 ? { value: `${conversionTrend > 0 ? '+' : ''}${conversionTrend}%`, up: conversionTrend > 0 } : undefined}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 size={20} className="text-indigo-500" />
                  Application Status
                </h3>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#F9FAFB' }}
                    />
                    <Bar dataKey="value" fill="#000000" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <PieChartIcon size={20} className="text-amber-500" />
                  Success by Source
                </h3>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {sourceData.map((entry, index) => {
                  const percentage = stats.total > 0 ? Math.round((entry.value / stats.total) * 100) : 0;
                  return (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-xs text-gray-500 font-medium">{entry.name} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <KanbanBoard user={user} applications={applications} />
      )}
    </div>
  );
}
