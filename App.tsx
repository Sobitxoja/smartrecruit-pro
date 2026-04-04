
import React, { useState, useEffect } from 'react';
import { User, UserRole, Job, Application, ApplicationStatus, Message } from './types';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import SeekerDashboard from './pages/SeekerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import JobDetails from './pages/JobDetails';
import CandidateProfile from './pages/CandidateProfile';
import ThemeToggle from './components/ThemeToggle';
import NotificationProvider, { useNotification } from './components/NotificationProvider';
import { storageService } from './services/storage';
import { supabaseService } from './src/services/supabaseService';
import { getSupabase } from './src/lib/supabase';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<'landing' | 'auth' | 'dashboard' | 'job' | 'candidate'>('landing');
  const [viewId, setViewId] = useState<string | null>(null); // To track which job/candidate to show
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [seekers, setSeekers] = useState<User[]>([]);
  const [employers, setEmployers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const { notify } = useNotification();
  const [isDark, setIsDark] = useState(() => storageService.getTheme() === 'dark');
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    setIsSupabaseReady(!!supabase);
    
    if (supabase) {
      // Simple connection test
      supabase.from('users').select('count', { count: 'exact', head: true })
        .then((result: { error: { message: string } | null }) => {
          const error = result.error;
          if (error) {
            console.error('Supabase Connection Test Failed:', error.message);
          } else {
            console.log('Supabase Connection Test Successful');
          }
        });
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      storageService.saveTheme('dark');
    } else {
      root.classList.remove('dark');
      storageService.saveTheme('light');
    }
  }, [isDark]);

  // Load data from storage on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // 1. Load from localStorage first for immediate UI
      const savedJobs = storageService.getJobs();
      const savedUsers = storageService.getUsers();
      const savedApps = storageService.getApplications();
      const savedUser = storageService.getCurrentUser();

      if (savedJobs.length > 0) setJobs(savedJobs);
      if (savedUsers.length > 0) {
        setSeekers(savedUsers.filter(u => u.role === UserRole.SEEKER));
        setEmployers(savedUsers.filter(u => u.role === UserRole.EMPLOYER));
      }
      if (savedApps.length > 0) setApplications(savedApps);
      if (savedUser) {
        setUser(savedUser);
        setCurrentPage('dashboard');
      }

      // 2. Try to sync from Supabase
      const supabase = getSupabase();
      if (supabase) {
        try {
          const [dbUsers, dbJobs, dbApps] = await Promise.all([
            supabaseService.getUsers(),
            supabaseService.getJobs(),
            supabaseService.getApplications()
          ]);

          if (dbUsers.length > 0) {
            setSeekers(dbUsers.filter(u => u.role === UserRole.SEEKER));
            setEmployers(dbUsers.filter(u => u.role === UserRole.EMPLOYER));
            storageService.saveUsers(dbUsers);
            
            if (savedUser) {
              const latestUser = dbUsers.find(u => u.id === savedUser.id);
              if (latestUser) {
                setUser(latestUser);
                storageService.saveCurrentUser(latestUser);
              }
            }
          }

          if (dbJobs.length > 0) {
            setJobs(dbJobs);
            storageService.saveJobs(dbJobs);
          }

          if (dbApps.length > 0) {
            setApplications(dbApps);
            storageService.saveApplications(dbApps);
          }
        } catch (err) {
          console.error('Supabase sync error:', err);
        }
      } else {
        // Fallback to initial data if everything is empty
        if (savedJobs.length === 0) {
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
              active: true,
              experienceRequired: null,
              locations: [
                { country: 'United States', city: 'San Francisco', workModes: ['On-site', 'Hybrid'] },
                { country: 'United Kingdom', city: 'London', workModes: ['Remote'] }
              ]
            }
          ];
          setJobs(initialJobs);
          storageService.saveJobs(initialJobs);
        }

        if (savedUsers.length === 0) {
          const initialSeekers: User[] = [
            { 
              id: 'c1', 
              name: 'Alice Smith', 
              email: 'alice@example.com', 
              role: UserRole.SEEKER, 
              skills: ['React', 'TypeScript', 'Node.js'], 
              experienceList: [], 
              bio: 'Passionate frontend developer eager to start my career.',
              preferredLocations: [{ country: 'United States', city: 'New York', workModes: ['Remote', 'Hybrid'] }],
              openToRelocation: true
            },
            { 
              id: 'c2', 
              name: 'Bob Johnson', 
              email: 'bob@example.com', 
              role: UserRole.SEEKER, 
              skills: ['Python', 'SQL', 'Data Analysis'], 
              experienceList: [], 
              bio: 'Aspiring data scientist looking for entry level opportunities.',
              preferredLocations: [{ country: 'United Kingdom', city: 'London', workModes: ['On-site'] }],
              openToRelocation: false
            }
          ];
          const initialEmployer: User = {
            id: 'e1',
            name: 'TechCorp HR',
            email: 'hr@techcorp.com',
            role: UserRole.EMPLOYER,
            companyName: 'TechCorp',
            bio: 'TechCorp is a global leader committed to pushing boundaries and fostering career growth. We innovate in the digital space to bring the future to the present.'
          };
          
          const allUsers = [...initialSeekers, initialEmployer];
          setSeekers(initialSeekers);
          setEmployers([initialEmployer]);
          storageService.saveUsers(allUsers);
        }
      }
    };

    loadInitialData();
  }, []);

  // Persist data changes - Only to local storage
  useEffect(() => {
    if (jobs.length > 0) {
      storageService.saveJobs(jobs);
    }
  }, [jobs]);

  useEffect(() => {
    if (seekers.length > 0 || employers.length > 0) {
      const allUsers = [...seekers, ...employers];
      storageService.saveUsers(allUsers);
    }
  }, [seekers, employers]);

  useEffect(() => {
    if (applications.length > 0) {
      storageService.saveApplications(applications);
    }
  }, [applications]);

  const handleLogin = (u: User) => {
    setUser(u);
    if (u.role === UserRole.SEEKER) {
      setSeekers(prev => {
        const exists = prev.find(s => s.id === u.id);
        if (exists) return prev.map(s => s.id === u.id ? u : s);
        return [...prev, u];
      });
    } else if (u.role === UserRole.EMPLOYER) {
      setEmployers(prev => {
        const exists = prev.find(e => e.id === u.id);
        if (exists) return prev.map(e => e.id === u.id ? u : e);
        return [...prev, u];
      });
    }
    storageService.saveCurrentUser(u);
    setCurrentPage('dashboard');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    if (updatedUser.role === UserRole.SEEKER) {
      setSeekers(prev => prev.map(s => s.id === updatedUser.id ? updatedUser : s));
    } else if (updatedUser.role === UserRole.EMPLOYER) {
      setEmployers(prev => prev.map(e => e.id === updatedUser.id ? updatedUser : e));
    }
    storageService.saveCurrentUser(updatedUser);
    supabaseService.saveUser(updatedUser); // Explicit save to Supabase
    notify('Profile updated successfully', 'success');
  };

  const handleLogout = () => {
    setUser(null);
    storageService.clearSession();
    setCurrentPage('landing');
    notify('Logged out', 'info');
  };

  const handleApply = (jobId: string, seekerId: string, note?: string) => {
    if (applications.some(app => app.jobId === jobId && app.seekerId === seekerId)) {
      notify("Already applied to this job", "warning");
      return;
    }

    // Default message if user doesn't type anything
    const initialText = note && note.trim() !== "" ? note : "Applied for the job";

    const initialMessages: Message[] = [{
      id: Math.random().toString(36).substr(2, 9),
      senderId: seekerId,
      senderName: user?.name || 'Candidate',
      text: initialText,
      timestamp: new Date().toISOString(),
      type: 'normal'
    }];

    const newApp: Application = {
      id: Math.random().toString(36).substr(2, 9),
      jobId,
      seekerId,
      status: ApplicationStatus.PENDING,
      appliedAt: new Date().toISOString(),
      messages: initialMessages
    };
    setApplications(prev => [...prev, newApp]);
    supabaseService.saveApplication(newApp); // Explicit save to Supabase

    if (user && user.id === seekerId) {
      const updatedUser = { ...user, appliedJobIds: [...(user.appliedJobIds || []), jobId] };
      handleUpdateUser(updatedUser);
    }
    notify("Application sent", "success");
  };

  const handleSendMessage = (appId: string, text: string, senderId: string, senderName: string) => {
    setApplications(prev => prev.map(app => {
      if (app.id === appId) {
        const newMessage: Message = {
          id: Math.random().toString(36).substr(2, 9),
          senderId,
          senderName,
          text,
          timestamp: new Date().toISOString(),
          type: 'normal'
        };
        const updatedApp = { ...app, messages: [...app.messages, newMessage] };
        supabaseService.saveApplication(updatedApp); // Explicit save to Supabase
        return updatedApp;
      }
      return app;
    }));
  };

  const handleCloseJob = (jobId: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        const updatedJob = { ...j, active: false };
        supabaseService.saveJob(updatedJob); // Explicit save to Supabase
        return updatedJob;
      }
      return j;
    }));
    notify("Job closed", "info");
  };

  const handleUpdateAppStatus = (appId: string, status: ApplicationStatus, messageText?: string) => {
    setApplications(prev => prev.map(a => {
      if (a.id === appId) {
        let updatedMessages = [...a.messages];
        if (messageText) {
          updatedMessages.push({
            id: Math.random().toString(36).substr(2, 9),
            senderId: user?.id || 'system',
            senderName: user?.name || 'System',
            text: messageText,
            timestamp: new Date().toISOString(),
            type: status === ApplicationStatus.INVITED ? 'invitation' : 'system'
          });
        }
        const updatedApp = { ...a, status, messages: updatedMessages };
        supabaseService.saveApplication(updatedApp); // Explicit save to Supabase
        return updatedApp;
      }
      return a;
    }));
    
    if (status === ApplicationStatus.INVITED) {
      notify("Invitation sent!", "success");
    } else if (status === ApplicationStatus.DECLINED) {
      notify("Application declined.", "info");
    } else {
      notify("Status updated", "success");
    }
  };

  // --- URL SYNCHRONIZATION ---
  // 1. Read URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    const id = params.get('id');

    if (page && ['landing', 'auth', 'dashboard', 'job', 'candidate'].includes(page)) {
      setCurrentPage(page as any);
      if (id) setViewId(id);
    }
  }, []);

  // 2. Update URL on state change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Only update if changed to avoid loops
    const currentUrlPage = params.get('page');
    const currentUrlId = params.get('id');

    if (currentUrlPage !== currentPage || currentUrlId !== (viewId || '')) {
      if (currentPage === 'landing') {
        window.history.pushState({}, '', window.location.pathname);
      } else {
        params.set('page', currentPage);
        if (viewId) {
          params.set('id', viewId);
        } else {
          params.delete('id');
        }
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);
      }
    }
  }, [currentPage, viewId]);

  // 3. Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const page = params.get('page');
      const id = params.get('id');

      if (page && ['landing', 'auth', 'dashboard', 'job', 'candidate'].includes(page)) {
        setCurrentPage(page as any);
        setViewId(id || null);
      } else {
        setCurrentPage('landing');
        setViewId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- NAVIGATION HANDLERS ---
  const navigateToJob = (jobId: string) => {
    setViewId(jobId);
    setCurrentPage('job');
    window.scrollTo(0,0);
  };

  const navigateToCandidate = (candidateId: string) => {
    setViewId(candidateId);
    setCurrentPage('candidate');
    window.scrollTo(0,0);
  };

  const navigateBackToDashboard = () => {
    setViewId(null);
    setCurrentPage('dashboard');
  };

  // --- PAGE RENDERING ---
  const renderPage = () => {
    switch (currentPage) {
      case 'landing': return <Landing onGetStarted={() => setCurrentPage('auth')} />;
      case 'auth': return <Auth onAuthSuccess={handleLogin} onBack={() => setCurrentPage('landing')} />;
      
      case 'job': {
        const targetJob = jobs.find(j => j.id === viewId);
        if (!targetJob || !user) return <div className="p-10 text-center">Job not found</div>;
        return (
          <JobDetails 
            job={targetJob} 
            currentUser={user} 
            onApply={handleApply}
            onCloseJob={handleCloseJob}
            applicationStatus={applications.find(app => app.jobId === targetJob.id && app.seekerId === user.id)?.status}
            onBack={navigateBackToDashboard}
          />
        );
      }

      case 'candidate': {
        const targetCandidate = seekers.find(s => s.id === viewId);
        if (!targetCandidate || !user) return <div className="p-10 text-center">Candidate not found</div>;
        
        // Prepare active jobs for employer to invite from
        const employerActiveJobs = user.role === UserRole.EMPLOYER 
          ? jobs.filter(j => j.employerId === user.id && j.active)
          : [];

        return (
          <CandidateProfile 
            candidate={targetCandidate} 
            onBack={navigateBackToDashboard} 
            availableJobs={employerActiveJobs}
            applications={applications}
            onInvite={user.role === UserRole.EMPLOYER ? (candidateId, jobId) => {
               // 1. Try to find an existing application to update
               const relevantApp = applications.find(a => 
                 a.seekerId === candidateId && 
                 (jobId ? a.jobId === jobId : jobs.find(j => j.id === a.jobId && j.employerId === user.id))
               );

               if(relevantApp) {
                 // Existing applicant -> Move to invited
                 handleUpdateAppStatus(relevantApp.id, ApplicationStatus.INVITED, "Invited to interview");
               } else {
                 // 2. No application found -> Headhunt logic (Create new Invite)
                 if (!jobId) {
                   notify("Please select a job to invite the candidate to.", "warning");
                   return;
                 }
                 
                 // Check if already invited or applied to this specific job
                 const existingInvite = applications.find(a => a.seekerId === candidateId && a.jobId === jobId);
                 if (existingInvite) {
                   notify("Candidate has already been invited or applied to this job.", "warning");
                   return;
                 }

                 const targetJob = jobs.find(j => j.id === jobId);
                 
                 const initialMessages: Message[] = [{
                    id: Math.random().toString(36).substr(2, 9),
                    senderId: user.id,
                    senderName: user.name,
                    text: "We would like to invite you to interview for this position.",
                    timestamp: new Date().toISOString(),
                    type: 'invitation'
                 }];

                 const newInvite: Application = {
                    id: Math.random().toString(36).substr(2, 9),
                    jobId: jobId,
                    seekerId: candidateId,
                    status: ApplicationStatus.INVITED,
                    appliedAt: new Date().toISOString(),
                    messages: initialMessages
                 };
                 
                 setApplications(prev => [...prev, newInvite]);
                 notify(`Invitation sent to candidate for: ${targetJob?.title}`, "success");
               }
            } : undefined}
          />
        );
      }

      case 'dashboard':
        if (!user) return <Landing onGetStarted={() => setCurrentPage('auth')} />;
        return user.role === UserRole.SEEKER ? (
          <SeekerDashboard 
            user={user} 
            jobs={jobs} 
            applications={applications}
            employers={employers}
            onLogout={handleLogout} 
            onUpdateUser={handleUpdateUser} 
            onApply={handleApply}
            onViewJob={navigateToJob}
            onUpdateAppStatus={handleUpdateAppStatus}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <EmployerDashboard 
            user={user} 
            jobs={jobs} 
            setJobs={setJobs} 
            seekers={seekers} 
            applications={applications}
            onLogout={handleLogout}
            onCloseJob={handleCloseJob}
            onUpdateAppStatus={handleUpdateAppStatus}
            onUpdateUser={handleUpdateUser}
            onViewCandidate={navigateToCandidate}
            onViewJob={navigateToJob}
            onSendMessage={handleSendMessage}
          />
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
