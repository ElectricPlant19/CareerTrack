import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  Calendar,
  CheckSquare,
  Building2,
  Users,
  ArrowRight,
  LayoutDashboard,
  Star,
  Kanban,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Kanban,
    title: 'Application Pipeline',
    desc: 'Visualize your job search with a Kanban board. Track every application from bookmarked to offer in one view.',
    accent: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    icon: FileText,
    title: 'Document Hub',
    desc: 'Store all your resumes, cover letters, and offer letters in one place. No more hunting through email attachments.',
    accent: 'bg-green-50 text-green-600 border-green-100',
  },
  {
    icon: Calendar,
    title: 'Interview Calendar',
    desc: 'Keep every interview and follow-up on a single calendar. Never miss a deadline or double-book a call again.',
    accent: 'bg-purple-50 text-purple-600 border-purple-100',
  },
  {
    icon: CheckSquare,
    title: 'Task Manager',
    desc: 'Create prioritized to-dos tied to specific applications. Always know exactly what to do next.',
    accent: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    icon: Building2,
    title: 'Company Research',
    desc: 'Build a living database of target companies with notes and ratings. Know your prospects inside out.',
    accent: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  },
  {
    icon: Users,
    title: 'Contact Network',
    desc: 'Track recruiters, hiring managers, and referrals. Remember every conversation and relationship.',
    accent: 'bg-rose-50 text-rose-600 border-rose-100',
  },
];

const TESTIMONIALS = [
  {
    quote: "CareerTrack helped me organize 40+ applications without losing my mind. I finally felt in control of my job search.",
    name: "Sarah K.",
    role: "CS Senior, University of Michigan",
    initials: "SK",
    bg: "bg-blue-100",
    text: "text-blue-600",
  },
  {
    quote: "The Kanban board is a game changer. I could see at a glance which companies needed a follow-up and which were cold.",
    name: "Marcus T.",
    role: "MBA Candidate, Wharton",
    initials: "MT",
    bg: "bg-purple-100",
    text: "text-purple-600",
  },
  {
    quote: "Finally one place for my resume versions, cover letters, and interview notes. My entire job search — organized.",
    name: "Priya M.",
    role: "Engineering Student, Georgia Tech",
    initials: "PM",
    bg: "bg-green-100",
    text: "text-green-600",
  },
];

const MOCK_APPS = [
  { company: 'Stripe', role: 'Software Engineer Intern', stage: 'Interview', stageColor: 'bg-purple-100 text-purple-600' },
  { company: 'Figma', role: 'Product Design Intern', stage: 'Applied', stageColor: 'bg-blue-100 text-blue-600' },
  { company: 'Notion', role: 'Engineering Intern', stage: 'Offer', stageColor: 'bg-green-100 text-green-600' },
  { company: 'Linear', role: 'Frontend Engineer', stage: 'Bookmarked', stageColor: 'bg-gray-100 text-gray-600' },
];

const MOCK_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', active: false },
  { icon: Briefcase, label: 'Applications', active: true },
  { icon: FileText, label: 'Documents', active: false },
  { icon: Calendar, label: 'Calendar', active: false },
  { icon: CheckSquare, label: 'Tasks', active: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Briefcase className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight">CareerTrack</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-black transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-black transition-colors">Testimonials</a>
          </nav>
          <Link
            to="/login"
            className="bg-black text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all duration-200 active:scale-[0.98]"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-28 grid md:grid-cols-2 gap-16 items-center">

        {/* Left: copy */}
        <div>
          <div className="inline-flex items-center gap-2 bg-white border border-gray-100 shadow-sm rounded-full px-4 py-1.5 text-xs font-medium text-gray-500 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Free for students · No credit card needed
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Your job search,{' '}
            <span className="text-gray-400">organized.</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-md">
            CareerTrack is the all-in-one CRM built for students. Track applications, store documents, schedule interviews, and manage contacts — all in one clean workspace.
          </p>
          <div className="flex flex-wrap gap-3 mb-12">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3.5 rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-200 active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight size={18} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3.5 rounded-2xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              See Features
            </a>
          </div>
          {/* Stats row */}
          <div className="flex gap-8 text-sm">
            <div>
              <p className="text-2xl font-bold tracking-tight">6+</p>
              <p className="text-gray-500">Tracking tools</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <p className="text-2xl font-bold tracking-tight">100%</p>
              <p className="text-gray-500">Free to use</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <p className="text-2xl font-bold tracking-tight">Google</p>
              <p className="text-gray-500">Sign in instantly</p>
            </div>
          </div>
        </div>

        {/* Right: product mockup */}
        <div className="relative hidden md:block">
          {/* Soft background glow */}
          <div className="absolute inset-0 -m-6 bg-gradient-to-br from-blue-50 via-purple-50/60 to-indigo-50 rounded-3xl blur-3xl opacity-70" />
          <div className="relative bg-white rounded-3xl border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
              <span className="w-3 h-3 rounded-full bg-red-300" />
              <span className="w-3 h-3 rounded-full bg-amber-300" />
              <span className="w-3 h-3 rounded-full bg-green-300" />
              <span className="ml-4 flex-1 bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400">
                careertrack.app/applications
              </span>
            </div>
            {/* App chrome */}
            <div className="flex" style={{ height: 336 }}>
              {/* Mock sidebar */}
              <div className="w-40 bg-white border-r border-gray-100 p-3 flex flex-col gap-1 flex-shrink-0">
                <div className="flex items-center gap-1.5 mb-4 px-1.5">
                  <div className="w-5 h-5 bg-black rounded flex items-center justify-center flex-shrink-0">
                    <Briefcase className="text-white" size={10} />
                  </div>
                  <span className="text-[11px] font-bold">CareerTrack</span>
                </div>
                {MOCK_NAV.map(({ icon: Icon, label, active }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium ${
                      active ? 'bg-black text-white' : 'text-gray-400'
                    }`}
                  >
                    <Icon size={12} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              {/* Mock content */}
              <div className="flex-1 p-4 overflow-hidden bg-[#F8F9FA]">
                <p className="text-[11px] font-bold text-gray-800 mb-3">Applications</p>
                <div className="space-y-2">
                  {MOCK_APPS.map((app) => (
                    <div
                      key={app.company}
                      className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center justify-between"
                    >
                      <div>
                        <p className="text-[11px] font-semibold text-gray-800">{app.company}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{app.role}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${app.stageColor}`}>
                        {app.stage}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl font-bold tracking-tight mb-4">Everything your job search needs</h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Six powerful tools, one workspace. Spend less time wrangling spreadsheets and more time landing interviews.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, accent }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:shadow-black/5 transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 border ${accent}`}>
                <Icon size={22} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-white border-y border-gray-100 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Up and running in minutes</h2>
            <p className="text-lg text-gray-500">
              Sign in with Google and start tracking your first application in under 60 seconds.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                title: 'Sign in with Google',
                desc: 'One click with your existing Google account. No forms, no passwords, no friction.',
              },
              {
                step: '02',
                title: 'Add your applications',
                desc: "Log the roles you're targeting. Set the stage, add notes, and attach your documents.",
              },
              {
                step: '03',
                title: 'Stay on top of it all',
                desc: 'Use the pipeline, calendar, and tasks to track every opportunity from first click to offer letter.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-8xl font-black text-gray-100 leading-none select-none mb-3">{step}</div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-4xl font-bold tracking-tight">Students love CareerTrack</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ quote, name, role, initials, bg, text }) => (
            <div key={name} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-6">"{quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${bg} ${text} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-gray-400">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-black text-white py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Briefcase className="text-white" size={28} />
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Ready to take control of your job search?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            Join students who are already using CareerTrack to stay organized, follow up faster, and land more interviews.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all duration-200 active:scale-[0.98]"
          >
            Get Started — It's Free
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-black border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <Briefcase className="text-black" size={12} />
            </div>
            <span className="text-white font-semibold">CareerTrack</span>
          </div>
          <p>© 2025 CareerTrack. Built for students.</p>
        </div>
      </footer>

    </div>
  );
}
