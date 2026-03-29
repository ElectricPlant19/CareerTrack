import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useApplications } from '../hooks/useApplications';
import {
  TrendingUp,
  CheckCircle2,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Info,
  AlertTriangle
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
  Cell
} from 'recharts';
import KanbanBoard from './KanbanBoard';

type DateRange = 30 | 60 | 90;

const METRIC_TOOLTIPS: Record<string, string> = {
  'Total Applications': 'All applications ever tracked, regardless of status.',
  'Interview Rate': 'Percentage of active applications (Applied → Offer) that reached Phone Screen or Interview stage.',
  'Offers Received': 'Applications currently at Offer status.',
  'Conversion Rate': 'Percentage of active applications that resulted in an Offer.',
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  trend?: { value: string; up: boolean };
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
          <Icon className={color.replace('bg-', 'text-')} size={24} />
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {trend.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trend.value}
            </div>
          )}
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-gray-300 hover:text-gray-500 transition-colors"
            >
              <Info size={14} />
            </button>
            {showTooltip && METRIC_TOOLTIPS[title] && (
              <div className="absolute right-0 top-6 z-10 w-56 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl leading-relaxed">
                {METRIC_TOOLTIPS[title]}
              </div>
            )}
          </div>
        </div>
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
};

const EmptyChart = ({ message }: { message: string }) => (
  <div className="h-[300px] flex flex-col items-center justify-center text-gray-300">
    <BarChart3 size={48} className="mb-3 opacity-30" />
    <p className="text-sm font-medium text-gray-400">{message}</p>
  </div>
);

export default function Dashboard({ user }: { user: UserProfile }) {
  const { applications, loading } = useApplications(user.uid);
  const [view, setView] = useState<'kanban' | 'overview'>('kanban');
  const [dateRange, setDateRange] = useState<DateRange>(30);

  const now = Date.now();

  const rangeApps = applications.filter(a =>
    a.applicationDate && (now - new Date(a.applicationDate).getTime()) / (1000 * 60 * 60 * 24) <= dateRange
  );
  const prevRangeApps = applications.filter(a =>
    a.applicationDate &&
    (now - new Date(a.applicationDate).getTime()) / (1000 * 60 * 60 * 24) > dateRange &&
    (now - new Date(a.applicationDate).getTime()) / (1000 * 60 * 60 * 24) <= dateRange * 2
  );

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status !== 'Bookmarked' && a.status !== 'Archived').length,
    interviews: applications.filter(a => a.status === 'Interview' || a.status === 'Phone Screen').length,
    offers: applications.filter(a => a.status === 'Offer').length,
    rejections: applications.filter(a => a.status === 'Rejected').length,
  };

  // Trends (comparing current range vs prior range)
  const currentTotal = rangeApps.length;
  const previousTotal = prevRangeApps.length;
  const totalTrend = previousTotal > 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100) : 0;

  const currentInterviews = rangeApps.filter(a => a.status === 'Interview' || a.status === 'Phone Screen').length;
  const previousInterviews = prevRangeApps.filter(a => a.status === 'Interview' || a.status === 'Phone Screen').length;
  const interviewTrend = previousInterviews > 0 ? Math.round(((currentInterviews - previousInterviews) / previousInterviews) * 100) : 0;

  const currentOffers = rangeApps.filter(a => a.status === 'Offer').length;
  const previousOffers = prevRangeApps.filter(a => a.status === 'Offer').length;
  const offersTrend = previousOffers > 0 ? Math.round(((currentOffers - previousOffers) / previousOffers) * 100) : 0;

  const conversionRate = stats.applied > 0 ? ((stats.offers / stats.applied) * 100).toFixed(1) : '0';
  const interviewRate = stats.applied > 0 ? ((stats.interviews / stats.applied) * 100).toFixed(1) : '0';

  const prevApplied = prevRangeApps.filter(a => a.status !== 'Bookmarked' && a.status !== 'Archived').length;
  const currentConversion = stats.applied > 0 ? (stats.offers / stats.applied) * 100 : 0;
  const previousConversion = prevApplied > 0 ? (previousOffers / prevApplied) * 100 : 0;
  const conversionTrend = previousConversion > 0 ? Math.round(((currentConversion - previousConversion) / previousConversion) * 100) : 0;

  // Chart data filtered by date range
  const chartApps = rangeApps;

  const sourceData = Object.entries(
    chartApps.reduce((acc, app) => {
      const source = app.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const statusData = [
    { name: 'Applied', value: chartApps.filter(a => a.status === 'Applied').length },
    { name: 'Interview', value: chartApps.filter(a => ['Phone Screen', 'Interview'].includes(a.status)).length },
    { name: 'Offer', value: chartApps.filter(a => a.status === 'Offer').length },
    { name: 'Rejected', value: chartApps.filter(a => a.status === 'Rejected').length },
  ].filter(d => d.value > 0);

  const COLORS = ['#000000', '#6366F1', '#10B981', '#EF4444', '#F59E0B'];

  // Stale applications: not in terminal status, last updated > 10 days ago
  const staleApps = applications.filter(a => {
    if (['Offer', 'Rejected', 'Archived'].includes(a.status)) return false;
    const lastUpdate = a.updatedAt || a.applicationDate;
    const daysSince = (now - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 10;
  });

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100"></div>)}
      </div>
      <div className="h-96 bg-white rounded-3xl border border-gray-100"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline Dashboard</h1>
          <p className="text-gray-500 mt-1">Track your progress and application funnel metrics.</p>
        </div>
        <div className="flex items-center gap-3 self-start flex-wrap">
          <div className="flex items-center bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
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
          {view === 'overview' && (
            <div className="flex items-center bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
              {([30, 60, 90] as DateRange[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDateRange(d)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${dateRange === d ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                >
                  {d}d
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {view === 'overview' ? (
        <>
          {staleApps.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  {staleApps.length} application{staleApps.length > 1 ? 's' : ''} with no activity in 10+ days
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Consider following up: {staleApps.slice(0, 3).map(a => `${a.companyName} (${a.status})`).join(', ')}
                  {staleApps.length > 3 ? ` +${staleApps.length - 3} more` : ''}
                </p>
              </div>
            </div>
          )}

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
                <span className="text-xs text-gray-400 font-medium">Last {dateRange} days</span>
              </div>
              {statusData.length === 0 ? (
                <EmptyChart message={`No applications in the last ${dateRange} days.`} />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#F9FAFB' }}
                        formatter={(value: number) => [value, 'Applications']}
                      />
                      <Bar dataKey="value" fill="#000000" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <PieChartIcon size={20} className="text-amber-500" />
                  Applications by Source
                </h3>
                <span className="text-xs text-gray-400 font-medium">Last {dateRange} days</span>
              </div>
              {sourceData.length === 0 ? (
                <EmptyChart message={`No source data for the last ${dateRange} days.`} />
              ) : (
                <>
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
                          {sourceData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [value, 'Applications']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {sourceData.map((entry, index) => {
                      const total = sourceData.reduce((s, d) => s + d.value, 0);
                      const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                      return (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-xs text-gray-500 font-medium">{entry.name} ({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <KanbanBoard user={user} applications={applications} />
      )}
    </div>
  );
}
