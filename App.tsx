
import React, { useState, useEffect } from 'react';
import { User, UserRole, Job } from './types';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import SeekerDashboard from './pages/SeekerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import ThemeToggle from './components/ThemeToggle';
import NotificationProvider, { useNotification } from './components/NotificationProvider';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [seekers, setSeekers] = useState<User[]>([]);
  const { notify } = useNotification();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('recruit_theme');
    return saved === 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('recruit_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('recruit_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const savedJobs = localStorage.getItem('recruit_jobs');
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs));
    } else {
      const initialJobs: Job[] = [
        {
          id: 'j1',
          employerId: 'e1',
          companyName: 'TechCorp',
          title: 'Junior Web Developer',
          description: 'Join our dynamic team building next-generation web applications. You will work with React, TypeScript, and modern styling frameworks. \n\nWe are looking for someone who is eager to learn and grow within the company.',
          requirements: ['React', 'TypeScript', 'Tailwind CSS'],
          salary: '$50k - $70k',
          postedAt: new Date().toISOString(),
          experienceRequired: null,
          locations: [
            { type: 'remote', anywhere: true },
            { type: 'on-site', country: 'USA', city: 'San Francisco' }
          ]
        }
      ];
      setJobs(initialJobs);
      localStorage.setItem('recruit_jobs', JSON.stringify(initialJobs));
    }

    const savedSeekers = localStorage.getItem('recruit_seekers');
    if (savedSeekers) {
      setSeekers(JSON.parse(savedSeekers));
    } else {
      const initialSeekers: User[] = [
        { id: 'c1', name: 'Alice Smith', email: 'alice@example.com', role: UserRole.SEEKER, skills: ['React', 'TypeScript', 'Node.js'], experienceList: [], bio: 'Passionate frontend developer eager to start my career.' },
        { id: 'c2', name: 'Bob Johnson', email: 'bob@example.com', role: UserRole.SEEKER, skills: ['Python', 'SQL', 'Data Analysis'], experienceList: [], bio: 'Aspiring data scientist looking for entry level opportunities.' }
      ];
      setSeekers(initialSeekers);
      localStorage.setItem('recruit_seekers', JSON.stringify(initialSeekers));
    }

    const savedUser = localStorage.getItem('recruit_active_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentPage('dashboard');
    }
  }, []);

  useEffect(() => {
    if (jobs.length > 0) localStorage.setItem('recruit_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    if (seekers.length > 0) localStorage.setItem('recruit_seekers', JSON.stringify(seekers));
  }, [seekers]);

  const handleLogin = (u: User) => {
    setUser(u);
    if (u.role === UserRole.SEEKER) {
      const exists = seekers.find(s => s.id === u.id);
      if (!exists) setSeekers(prev => [...prev, u]);
    }
    localStorage.setItem('recruit_active_user', JSON.stringify(u));
    setCurrentPage('dashboard');
    notify(`Welcome, ${u.name}!`, 'success');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    if (updatedUser.role === UserRole.SEEKER) {
      setSeekers(prev => prev.map(s => s.id === updatedUser.id ? updatedUser : s));
    }
    localStorage.setItem('recruit_active_user', JSON.stringify(updatedUser));
    notify('Profile updated successfully', 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('recruit_active_user');
    setCurrentPage('landing');
    notify('Logged out', 'info');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing': return <Landing onGetStarted={() => setCurrentPage('auth')} />;
      case 'auth': return <Auth onAuthSuccess={handleLogin} onBack={() => setCurrentPage('landing')} />;
      case 'dashboard':
        if (!user) return <Landing onGetStarted={() => setCurrentPage('auth')} />;
        return user.role === UserRole.SEEKER ? (
          <SeekerDashboard user={user} jobs={jobs} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
        ) : (
          <EmployerDashboard user={user} jobs={jobs} setJobs={setJobs} seekers={seekers} onLogout={handleLogout} />
        );
      default: return <Landing onGetStarted={() => setCurrentPage('auth')} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 w-full overflow-x-hidden">
      {renderPage()}
      <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
    </div>
  );
};

const App: React.FC = () => (
  <NotificationProvider>
    <AppContent />
  </NotificationProvider>
);

export default App;
