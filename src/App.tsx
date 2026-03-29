import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signInWithPopup, signInWithRedirect, googleProvider, signOut, db, doc, setDoc, getDoc } from './firebase';
import { UserProfile } from './types';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Users, 
  Building2, 
  LogOut, 
  Plus,
  Search,
  Menu,
  X,
  User as UserIcon,
  FileText
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ApplicationList from './components/ApplicationList';
import Calendar from './components/Calendar';
import TaskList from './components/TaskList';
import CompanyList from './components/CompanyList';
import ContactList from './components/ContactList';
import DocumentsList from './components/DocumentsList';
import LandingPage from './components/LandingPage';

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: React.ElementType, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-black text-white shadow-lg shadow-black/10' 
        : 'text-gray-500 hover:bg-gray-100 hover:text-black'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout = ({ user, children }: { user: UserProfile, children: React.ReactNode }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Briefcase className="text-white" size={18} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">CareerTrack</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <SidebarItem to="/applications" icon={Briefcase} label="Applications" active={location.pathname === '/applications'} />
          <SidebarItem to="/documents" icon={FileText} label="Documents" active={location.pathname === '/documents'} />
          <SidebarItem to="/calendar" icon={CalendarIcon} label="Calendar" active={location.pathname === '/calendar'} />
          <SidebarItem to="/tasks" icon={CheckSquare} label="Tasks" active={location.pathname === '/tasks'} />
          <SidebarItem to="/companies" icon={Building2} label="Companies" active={location.pathname === '/companies'} />
          <SidebarItem to="/contacts" icon={Users} label="Contacts" active={location.pathname === '/contacts'} />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <UserIcon size={20} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.displayName || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Briefcase className="text-white" size={18} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">CareerTrack</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-[60]" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white p-6 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end mb-8">
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 space-y-2">
              <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
              <SidebarItem to="/applications" icon={Briefcase} label="Applications" active={location.pathname === '/applications'} />
              <SidebarItem to="/documents" icon={FileText} label="Documents" active={location.pathname === '/documents'} />
              <SidebarItem to="/calendar" icon={CalendarIcon} label="Calendar" active={location.pathname === '/calendar'} />
              <SidebarItem to="/tasks" icon={CheckSquare} label="Tasks" active={location.pathname === '/tasks'} />
              <SidebarItem to="/companies" icon={Building2} label="Companies" active={location.pathname === '/companies'} />
              <SidebarItem to="/contacts" icon={Users} label="Contacts" active={location.pathname === '/contacts'} />
            </nav>
            <div className="mt-auto pt-6 border-t border-gray-100">
              <button 
                onClick={() => signOut(auth)}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 pt-24 md:pt-10">
        {children}
      </main>
    </div>
  );
};

const Login = () => {
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      const authCode = (error as { code?: string })?.code || 'auth/unknown';
      console.error('Login error:', authCode, error);

      if (authCode === 'auth/popup-blocked' || authCode === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      if (authCode === 'auth/unauthorized-domain') {
        setLoginError('This domain is not authorized in Firebase Auth. Add localhost (or your domain) to Authorized domains.');
      } else if (authCode === 'auth/operation-not-allowed') {
        setLoginError('Google sign-in is not enabled in Firebase Authentication > Sign-in method.');
      } else {
        setLoginError(`Sign-in failed (${authCode}). Check browser console for details.`);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-black/5 p-10 text-center border border-gray-100">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-black/20">
          <Briefcase className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Welcome to CareerTrack</h1>
        <p className="text-gray-500 mb-10 leading-relaxed">
          The all-in-one CRM for students to manage their internship and job search journey.
        </p>
        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-black text-white py-4 rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-200 active:scale-[0.98]"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Sign in with Google
        </button>
        {loginError && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 text-left">
            {loginError}
          </p>
        )}
        <p className="mt-8 text-xs text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: '' // Will be updated from Firestore if needed
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/*"
          element={
            user ? (
              <Layout user={user}>
                <Routes>
                  <Route path="/" element={<Dashboard user={user} />} />
                  <Route path="/applications" element={<ApplicationList user={user} />} />
                  <Route path="/documents" element={<DocumentsList user={user} />} />
                  <Route path="/calendar" element={<Calendar user={user} />} />
                  <Route path="/tasks" element={<TaskList user={user} />} />
                  <Route path="/companies" element={<CompanyList user={user} />} />
                  <Route path="/contacts" element={<ContactList user={user} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            ) : (
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </Routes>
            )
          }
        />
      </Routes>
    </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}
