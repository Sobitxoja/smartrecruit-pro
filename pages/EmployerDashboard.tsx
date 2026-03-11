
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { User, Job, Location, JobLocation, JobLocation as JobLocationType, MatchResult, Application, ApplicationStatus, Message } from '../types';
import { getSmartMatch } from '../services/geminiService';
import { storageService } from '../services/storage';
import { supabaseService } from '../src/services/supabaseService';
import { useNotification } from '../components/NotificationProvider';
import Autocomplete from '../components/Autocomplete';
import EmptyState from '../components/EmptyState';
import AppTour from '../components/AppTour';
import RichTextEditor from '../components/RichTextEditor';
import SalaryRange from '../components/SalaryRange';
import { COMMON_SKILLS, COUNTRIES, CITIES_BY_COUNTRY, WORK_MODES, CITIES, COMMON_ROLES } from '../constants';

const CandidateCard = React.memo(({ seeker, onViewCandidate }: { seeker: User, onViewCandidate: (id: string) => void }) => (
  <div onClick={() => onViewCandidate(seeker.id)} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group">
    <div className="flex items-center gap-4 mb-4">
      <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center text-xl font-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {seeker.name[0]}
      </div>
      <div>
        <h3 className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{seeker.name}</h3>
        <p className="text-xs text-slate-500 font-bold">
          {seeker.preferredRole ? `${seeker.preferredRole} • ` : ''}
          {seeker.preferredLocations?.[0]?.city || 'Remote'}
        </p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 mb-4 h-16 overflow-hidden content-start">
      {seeker.skills?.slice(0, 5).map(skill => (
        <span key={skill} className="px-2 py-1 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase rounded border dark:border-slate-700">
          {skill}
        </span>
      ))}
    </div>
    <div className="text-xs font-black text-blue-600 uppercase tracking-widest text-right">View Profile →</div>
  </div>
));

interface Props {
  user: User;
  jobs: Job[];
  seekers: User[];
  applications: Application[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  onCloseJob: (jobId: string) => void;
  onUpdateAppStatus: (appId: string, status: ApplicationStatus, message?: string) => void;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onViewCandidate: (candidateId: string) => void;
  onViewJob: (jobId: string) => void;
  onSendMessage?: (appId: string, text: string, senderId: string, senderName: string) => void;
}

const EmployerDashboard: React.FC<Props> = ({ user, jobs, seekers, applications, setJobs, onCloseJob, onUpdateAppStatus, onLogout, onUpdateUser, onViewCandidate, onViewJob, onSendMessage }) => {
  const [view, setView] = useState<'listings' | 'post' | 'candidates' | 'applicants' | 'profile' | 'applicant_detail'>('listings');
  const [matchingStatus, setMatchingStatus] = useState<string>('');
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [activeJobForMatching, setActiveJobForMatching] = useState<Job | null>(null);
  const [activeApplicantId, setActiveApplicantId] = useState<string | null>(null);
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'profile' | 'chat'>('profile');
  const [candidateSearchTerm, setCandidateSearchTerm] = useState('');
  const [applicantFilter, setApplicantFilter] = useState<ApplicationStatus>(ApplicationStatus.PENDING);
  
  // Tour State
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenEmployerTour');
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, []);

  const handleTourFinish = () => {
    setRunTour(false);
    localStorage.setItem('hasSeenEmployerTour', 'true');
  };

  const tourSteps = [
    {
      target: '#tour-nav-jobs',
      content: 'Manage your active job listings here. View applicants and close positions.',
      disableBeacon: true,
    },
    {
      target: '#tour-nav-post',
      content: 'Create and publish new job vacancies to find top talent.',
    },
    {
      target: '#tour-nav-talent',
      content: 'Browse our database of candidates and invite them to apply.',
    },
    {
      target: '#tour-nav-analytics',
      content: 'Track your hiring performance with detailed analytics.',
    }
  ];
  
  // Action Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [inviteJobId, setInviteJobId] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Chat
  const [messageInput, setMessageInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const { notify } = useNotification();
  
  // Profile state
  const [companyName, setCompanyName] = useState(user.companyName || '');
  const [companyBio, setCompanyBio] = useState(user.bio || '');
  const [companyLocation, setCompanyLocation] = useState(user.companyLocation || '');

  useEffect(() => {
    setCompanyName(user.companyName || '');
    setCompanyBio(user.bio || '');
    setCompanyLocation(user.companyLocation || '');
  }, [user]);

  const [newJob, setNewJob] = useState({ 
    title: '', description: '', requirements: [] as string[], salary: '', isEntryLevel: true, expAmount: 0, expUnit: 'years' as 'months' | 'years', locations: [] as JobLocation[]
  });
  const [tempLoc, setTempLoc] = useState<Location>({ country: '', city: '' });
  const [tempWorkModes, setTempWorkModes] = useState<string[]>([]);

  useEffect(() => {
    if (detailTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [detailTab, applications, activeApplicationId]);

  const handleAddLocation = () => {
    if (!tempLoc.country || !tempLoc.city) return notify("Please select a Country and City.", "warning");
    if (tempWorkModes.length === 0) return notify("Select work mode.", "warning");
    
    // Prevent duplicates
    const exists = newJob.locations.some(l => l.country === tempLoc.country && l.city === tempLoc.city);
    if (exists) return notify("Location already added.", "warning");

    setNewJob(prev => ({ ...prev, locations: [...prev.locations, { ...tempLoc, workModes: tempWorkModes }] }));
    setTempLoc({ country: '', city: '' });
    setTempWorkModes([]);
  };

  const removeLocation = (index: number) => {
    setNewJob(prev => ({ ...prev, locations: prev.locations.filter((_, i) => i !== index) }));
  };

  const toggleTempWorkMode = (mode: string) => setTempWorkModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]);

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (newJob.locations.length === 0) return notify("Add at least one location.", "error");
    
    // Check if salary is number or string range
    const isNum = !isNaN(Number(newJob.salary)) && newJob.salary.trim() !== '';
    const formattedSalary = isNum 
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(newJob.salary))
      : newJob.salary;

    const job: Job = {
      id: Math.random().toString(36).substr(2, 9),
      employerId: user.id,
      companyName: user.companyName || 'Verified Enterprise',
      title: newJob.title,
      description: newJob.description,
      requirements: newJob.requirements,
      salary: formattedSalary,
      postedAt: new Date().toISOString(),
      active: true,
      experienceRequired: newJob.isEntryLevel ? null : { amount: newJob.expAmount, unit: newJob.expUnit },
      locations: newJob.locations
    };
    
    // Persist job
    storageService.saveJob(job);
    supabaseService.saveJob(job); // Explicit save to Supabase
    
    setJobs([job, ...jobs]);
    setView('listings');
    notify("Job published!", "success");
    setNewJob({ title: '', description: '', requirements: [], salary: '', isEntryLevel: true, expAmount: 0, expUnit: 'years', locations: [] });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ ...user, companyName: companyName, bio: companyBio, companyLocation: companyLocation });
    
    // Update local jobs state and persist changes
    setJobs(prev => {
      const updatedJobs = prev.map(j => {
        if (j.employerId === user.id) {
          const updatedJob = { ...j, companyName: companyName };
          storageService.saveJob(updatedJob); // Persist each updated job
          supabaseService.saveJob(updatedJob); // Also persist to Supabase
          return updatedJob;
        }
        return j;
      });
      return updatedJobs;
    });
    
    notify("Profile updated!", "success");
  };

  const handleSmartMatch = async (job: Job) => {
    if (activeJobForMatching?.id === job.id) {
        // Toggle off if already showing
        setActiveJobForMatching(null);
        return;
    }
    setActiveJobForMatching(job);
    setMatchingStatus('AI is analyzing...');
    setMatchResults([]);
    try {
      const results = await getSmartMatch(job, seekers);
      setMatchResults(results);
    } catch (err) { notify("Matching failed.", "error"); } finally { setMatchingStatus(''); }
  };

  const openApplicantDetail = (appId: string, seekerId: string) => {
    setActiveApplicantId(seekerId);
    setActiveApplicationId(appId);
    setDetailTab('profile');
    setView('applicant_detail');
  };

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeApplicationId || !onSendMessage) return;
    onSendMessage(activeApplicationId, messageInput, user.id, user.name);
    setMessageInput('');
  };

  const confirmInvite = () => {
    if (!activeApplicationId || !inviteJobId) return;
    onUpdateAppStatus(activeApplicationId, ApplicationStatus.INVITED, actionMessage || "We would like to invite you to an interview.");
    setShowInviteModal(false);
    setActionMessage('');
  };

  const confirmSchedule = () => {
    if (!activeApplicationId || !scheduleDate || !scheduleTime) return;
    const dateTime = `${scheduleDate} at ${scheduleTime}`;
    onUpdateAppStatus(activeApplicationId, ApplicationStatus.INVITED, `Interview scheduled for ${dateTime}`);
    setShowScheduleModal(false);
    setScheduleDate('');
    setScheduleTime('');
  };

  const confirmDecline = () => {
    if (!activeApplicationId) return;
    onUpdateAppStatus(activeApplicationId, ApplicationStatus.DECLINED, "Application declined.");
    setShowDeclineModal(false);
  };

  const myJobs = jobs.filter(j => j.employerId === user.id || j.companyName === user.companyName);
  const incomingApps = applications.filter(app => myJobs.find(j => j.id === app.jobId));
  const activeApplication = applications.find(a => a.id === activeApplicationId);
  const activeSeeker = seekers.find(s => s.id === activeApplicantId);

  // Filter only active jobs for the listings view
  const activeJobs = myJobs.filter(j => j.active);

  // Advanced Candidate Search
  const filteredSeekers = useMemo(() => {
    if (!candidateSearchTerm) return seekers;
    const fuse = new Fuse(seekers, {
      keys: ['name', 'skills', 'bio', 'preferredLocations.city', 'preferredLocations.country', 'experienceList.position', 'experienceList.company'],
      threshold: 0.3,
    });
    return fuse.search(candidateSearchTerm).map(r => r.item);
  }, [seekers, candidateSearchTerm]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-200 overflow-x-hidden w-full">
      <AppTour run={runTour} steps={tourSteps} onFinish={handleTourFinish} />
      
      <nav className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700 sticky top-0 z-40 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight cursor-pointer" onClick={() => setView('listings')}>RecruitPro</span>
              <div className="flex space-x-1 sm:space-x-2">
                <button id="tour-nav-jobs" onClick={() => setView('listings')} className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-sm font-bold transition-all ${view === 'listings' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>My Jobs</button>
                <button onClick={() => setView('applicants')} className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-sm font-bold transition-all ${view === 'applicants' || view === 'applicant_detail' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Applicants ({incomingApps.length})</button>
                <button id="tour-nav-post" onClick={() => setView('post')} className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-sm font-bold transition-all ${view === 'post' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Post</button>
                <button id="tour-nav-talent" onClick={() => setView('candidates')} className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-sm font-bold transition-all ${view === 'candidates' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Talent</button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => setView('profile')} className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase hidden sm:block hover:text-blue-600">{user.companyName}</button>
              <button onClick={onLogout} className="text-[10px] sm:text-xs font-black text-red-600 uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-red-50 transition-all">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {view === 'listings' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div className="flex justify-between items-center">
               <h2 className="text-3xl font-black text-slate-900 dark:text-white">Active Vacancies</h2>
               <button onClick={() => setView('post')} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                 + Post New
               </button>
             </div>

             {activeJobs.length === 0 ? (
               <EmptyState 
                 title="No active jobs" 
                 description="You haven't posted any jobs yet. Create a vacancy to start hiring." 
                 actionLabel="Create Vacancy" 
                 onAction={() => setView('post')}
                 icon="💼"
               />
             ) : (
               <div className="grid gap-6">
                 {activeJobs.map(job => {
                   const appCount = applications.filter(a => a.jobId === job.id).length;
                   const isMatching = activeJobForMatching?.id === job.id;
                   
                   return (
                     <div key={job.id} className={`bg-white dark:bg-slate-800 rounded-3xl shadow-sm border transition-all overflow-hidden ${isMatching ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-100 dark:border-slate-700 hover:shadow-lg'}`}>
                       <div className="p-6 sm:p-8">
                         <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                           <div>
                             <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{job.title}</h3>
                             <div className="flex flex-wrap gap-2">
                               <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${job.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                 {job.active ? 'Active' : 'Closed'}
                               </span>
                               <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase">
                                 {job.salary.replace(/[kK]/g, '')}
                               </span>
                               <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase">
                                 {job.locations.length} Locations
                               </span>
                             </div>
                           </div>
                           <div className="flex flex-col items-end">
                             <span className="text-3xl font-black text-blue-600">{appCount}</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applicants</span>
                           </div>
                         </div>

                         <div className="flex flex-wrap gap-3 pt-6 border-t dark:border-slate-700">
                            <button onClick={() => onViewJob(job.id)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase hover:bg-slate-50 dark:hover:bg-slate-700">
                              View Details
                            </button>
                            <button onClick={() => { setView('applicants'); }} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase hover:bg-slate-50 dark:hover:bg-slate-700">
                              View Applicants
                            </button>
                            <button 
                              onClick={() => handleSmartMatch(job)} 
                              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition-all ${isMatching ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300'}`}
                            >
                              <span>✨</span> {isMatching ? 'Close Match' : 'AI Smart Match'}
                            </button>
                            {job.active && (
                              <button onClick={() => onCloseJob(job.id)} className="px-5 py-2.5 rounded-xl border border-red-100 text-red-600 font-bold text-xs uppercase hover:bg-red-50 ml-auto">
                                Close Job
                              </button>
                            )}
                         </div>

                         {/* AI Match Results */}
                         {isMatching && (
                           <div className="mt-8 bg-indigo-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-indigo-100 dark:border-slate-600 animate-in slide-in-from-top-4">
                             <div className="flex justify-between items-center mb-6">
                               <h4 className="font-black text-indigo-900 dark:text-indigo-200 uppercase text-xs tracking-widest">AI Candidate Recommendations</h4>
                               {matchingStatus && <span className="text-xs font-bold text-indigo-500 animate-pulse">{matchingStatus}</span>}
                             </div>
                             
                             {matchResults.length > 0 ? (
                               <div className="grid gap-3">
                                 {matchResults.map((result, idx) => {
                                   const candidate = seekers.find(s => s.id === result.candidateId);
                                   if (!candidate) return null;
                                   return (
                                     <div key={idx} onClick={() => onViewCandidate(candidate.id)} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group">
                                       <div className="flex items-center gap-4">
                                          <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm">{candidate.name[0]}</div>
                                          <div>
                                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{candidate.name}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-md">{result.reasoning}</div>
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-4">
                                          <span className="text-green-600 font-black text-sm">{result.score}% Match</span>
                                          <span className="text-slate-300">→</span>
                                       </div>
                                     </div>
                                   );
                                 })}
                               </div>
                             ) : (
                               !matchingStatus && <div className="text-center text-slate-400 text-xs font-bold py-4">No high-quality matches found for this role yet.</div>
                             )}
                           </div>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        )}

        {view === 'candidates' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Talent Pool</h2>
              <div className="relative w-full sm:w-auto">
                <input 
                  type="text" 
                  placeholder="Search candidates..." 
                  className="w-full sm:w-64 p-3 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  value={candidateSearchTerm}
                  onChange={(e) => setCandidateSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-3 text-slate-400">🔍</span>
              </div>
            </div>
            
            {filteredSeekers.length === 0 ? (
              <EmptyState 
                title="No candidates found" 
                description={candidateSearchTerm ? `No candidates match "${candidateSearchTerm}".` : "There are no candidates available at the moment."}
                icon="👥"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSeekers.map(seeker => (
                  <CandidateCard key={seeker.id} seeker={seeker} onViewCandidate={onViewCandidate} />
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'applicants' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-6">Applications Board</h2>
            
            <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
              {[
                { label: 'Applied', status: ApplicationStatus.PENDING },
                { label: 'Interview', status: ApplicationStatus.INVITED },
                { label: 'Offer', status: ApplicationStatus.OFFER },
                { label: 'Hire', status: ApplicationStatus.HIRED },
                { label: 'Declined', status: ApplicationStatus.DECLINED }
              ].map((tab) => (
                <button
                  key={tab.status}
                  onClick={() => setApplicantFilter(tab.status)}
                  className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    applicantFilter === tab.status 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4">
              {incomingApps.filter(app => app.status === applicantFilter).length === 0 ? (
                <EmptyState 
                  title={`No ${applicantFilter.toLowerCase()} applications`}
                  description={`There are currently no candidates in the ${applicantFilter.toLowerCase()} stage.`}
                  icon="📂"
                />
              ) : (
                incomingApps
                  .filter(app => app.status === applicantFilter)
                  .map(app => {
                    const seeker = seekers.find(s => s.id === app.seekerId);
                    const job = jobs.find(j => j.id === app.jobId);
                    if (!seeker || !job) return null;

                    return (
                      <div 
                        key={app.id} 
                        onClick={() => openApplicantDetail(app.id, seeker.id)}
                        className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-blue-500 cursor-pointer shadow-sm transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center text-lg font-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              {seeker.name[0]}
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{seeker.name}</h3>
                              <p className="text-blue-600 text-sm font-bold">{job.title}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                            app.status === ApplicationStatus.INVITED ? 'bg-green-100 text-green-700' : 
                            app.status === ApplicationStatus.DECLINED ? 'bg-red-100 text-red-700' : 
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        <div className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                          <span>Last message: {app.messages.length > 0 ? new Date(app.messages[app.messages.length - 1].timestamp).toLocaleDateString() : 'N/A'}</span>
                          <span className="text-blue-500 group-hover:translate-x-1 transition-transform">View Profile & Chat →</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {view === 'applicant_detail' && activeSeeker && activeApplication && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-900/50">
               <div className="flex items-center gap-4">
                 <button onClick={() => setView('applicants')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold mr-2">← Back</button>
                 <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black">{activeSeeker.name[0]}</div>
                 <div>
                   <h2 className="text-2xl font-black text-slate-900 dark:text-white">{activeSeeker.name}</h2>
                   <div className="flex gap-2 text-xs font-bold text-slate-500">
                      <span>{activeSeeker.preferredLocations?.[0]?.city || 'Remote'}</span>
                      <span>•</span>
                      <span className="text-blue-600">{activeApplication.status}</span>
                   </div>
                 </div>
               </div>
               
               {/* Actions */}
               <div className="flex gap-3">
                 {activeApplication.status === ApplicationStatus.PENDING && (
                   <button onClick={() => { setInviteJobId(activeApplication.jobId); setShowInviteModal(true); }} className="px-6 py-3 bg-green-600 text-white rounded-xl font-black uppercase text-xs hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none">Invite to Interview</button>
                 )}
                 {activeApplication.status === ApplicationStatus.INVITED && (
                   <button onClick={() => onUpdateAppStatus(activeApplication.id, ApplicationStatus.OFFER, "We are pleased to offer you the position!")} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none">Make Offer</button>
                 )}
                 {activeApplication.status === ApplicationStatus.OFFER && (
                   <button onClick={() => onUpdateAppStatus(activeApplication.id, ApplicationStatus.HIRED, "Welcome to the team!")} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none">Confirm Hire</button>
                 )}
                 {(activeApplication.status === ApplicationStatus.PENDING || activeApplication.status === ApplicationStatus.INVITED) && (
                   <button onClick={() => setShowScheduleModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none">Schedule Interview</button>
                 )}
                 {activeApplication.status !== ApplicationStatus.DECLINED && activeApplication.status !== ApplicationStatus.HIRED && (
                   <button onClick={() => setShowDeclineModal(true)} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase text-xs hover:bg-red-500 hover:text-white">Decline</button>
                 )}
               </div>
            </div>
            
            <div className="flex border-b dark:border-slate-700">
               <button onClick={() => setDetailTab('profile')} className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors ${detailTab === 'profile' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Profile</button>
               <button onClick={() => setDetailTab('chat')} className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors ${detailTab === 'chat' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Conversation</button>
            </div>

            {/* Content */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-900/30 overflow-hidden flex flex-col">
              {detailTab === 'profile' ? (
                <div className="p-8 overflow-y-auto h-[600px] space-y-8">
                   <div>
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Bio</h3>
                     <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{activeSeeker.bio || 'No bio provided.'}</p>
                   </div>
                   <div>
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Skills</h3>
                     <div className="flex flex-wrap gap-2">
                       {activeSeeker.skills?.map(s => <span key={s} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold">{s}</span>)}
                     </div>
                   </div>
                   <div>
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Experience</h3>
                     {activeSeeker.experienceList?.map(exp => (
                       <div key={exp.id} className="mb-6 border-l-2 border-slate-200 pl-4">
                         <h4 className="font-bold text-slate-900 dark:text-white">{exp.position}</h4>
                         <p className="text-blue-600 text-sm">{exp.company}</p>
                         <p className="text-slate-500 text-xs mt-1">{exp.description}</p>
                       </div>
                     ))}
                   </div>
                </div>
              ) : (
                <div className="flex flex-col h-[600px]">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {activeApplication.messages.map(msg => {
                      const isMe = msg.senderId === user.id;
                      const isSystem = msg.type === 'system' || msg.type === 'invitation';
                      
                      if (isSystem) {
                         return (
                           <div key={msg.id} className="flex justify-center my-4">
                             <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide text-center max-w-[80%] ${msg.type === 'invitation' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-200 text-slate-600'}`}>
                               {msg.text}
                             </div>
                           </div>
                         );
                      }
                      
                      return (
                         <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed break-words overflow-wrap-anywhere ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-600'}`}>
                             {msg.text}
                             <div className={`text-[10px] mt-2 font-bold ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                               {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </div>
                           </div>
                         </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>
                  {activeApplication.status !== ApplicationStatus.DECLINED && (
                    <div className="p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
                      <form onSubmit={handleSendMessageSubmit} className="flex gap-3">
                        <input className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-600 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="Type a message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} />
                        <button type="submit" className="px-6 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-blue-700 transition-colors">Send</button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'post' && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-300">
             <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">Post New Vacancy</h2>
             <form onSubmit={handlePostJob} className="space-y-8">
               <div className="space-y-4">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Basic Information</label>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <Autocomplete 
                     label="Job Title"
                     placeholder="e.g. Product Manager"
                     suggestions={COMMON_ROLES}
                     selectedItems={newJob.title ? [newJob.title] : []}
                     onSelectionChange={(items) => setNewJob({...newJob, title: items[0] || ''})}
                     singleSelect
                   />
                   <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Salary Range</label>
                     <SalaryRange 
                       value={newJob.salary} 
                       onChange={(val) => setNewJob({...newJob, salary: val})} 
                     />
                   </div>
                 </div>
               </div>

               <div className="space-y-4">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</label>
                 <RichTextEditor 
                   placeholder="Job Description & Responsibilities..." 
                   value={newJob.description} 
                   onChange={(val) => setNewJob({...newJob, description: val})} 
                 />
                 <Autocomplete 
                   label="Requirements & Skills"
                   placeholder="Type to search required skills..."
                   suggestions={COMMON_SKILLS}
                   selectedItems={newJob.requirements}
                   onSelectionChange={(items) => setNewJob({...newJob, requirements: items})}
                 />
               </div>

               <div className="space-y-4">
                 <div className="flex justify-between items-center border-b dark:border-slate-700 pb-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience Level</label>
                   <label className="flex items-center space-x-2 cursor-pointer">
                     <input type="checkbox" className="rounded h-5 w-5 text-blue-600" checked={newJob.isEntryLevel} onChange={e => setNewJob({...newJob, isEntryLevel: e.target.checked})} />
                     <span className="text-[10px] font-black text-slate-500 uppercase">Entry Level (No Experience)</span>
                   </label>
                 </div>
                 {!newJob.isEntryLevel && (
                    <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border dark:border-slate-700">
                      <input type="number" min="1" max="20" className="w-20 p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-white text-center font-bold" value={newJob.expAmount} onChange={e => setNewJob({...newJob, expAmount: parseInt(e.target.value) || 0})} />
                      <select className="p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-white font-bold" value={newJob.expUnit} onChange={e => setNewJob({...newJob, expUnit: e.target.value as any})}>
                        <option value="years">Years</option>
                        <option value="months">Months</option>
                      </select>
                      <span className="text-slate-500 font-bold">of experience required</span>
                    </div>
                 )}
               </div>

               <div className="space-y-4">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Locations & Work Modes</label>
                 <div className="flex flex-wrap gap-2 mb-3">
                   {newJob.locations.map((loc, idx) => (
                     <span key={idx} className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-xl text-xs font-black text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900 flex items-center">
                       {loc.city}, {loc.country} <span className="text-slate-400 mx-1">|</span> {loc.workModes.join(', ')}
                       <button type="button" onClick={() => removeLocation(idx)} className="ml-2 text-red-500 hover:text-red-700 font-bold">✕</button>
                     </span>
                   ))}
                 </div>

                 <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border dark:border-slate-700 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Autocomplete
                        label="Country"
                        placeholder="Select Country"
                        suggestions={COUNTRIES}
                        selectedItems={tempLoc.country ? [tempLoc.country] : []}
                        onSelectionChange={(items) => {
                          const newCountry = items[0] || '';
                          setTempLoc({ country: newCountry, city: '' });
                        }}
                        singleSelect
                      />
                      <Autocomplete
                        label="City"
                        placeholder={tempLoc.country ? "Select City" : "Select Country first"}
                        suggestions={tempLoc.country ? CITIES_BY_COUNTRY[tempLoc.country] || [] : []}
                        selectedItems={tempLoc.city ? [tempLoc.city] : []}
                        onSelectionChange={(items) => setTempLoc({ ...tempLoc, city: items[0] || '' })}
                        singleSelect
                        disabled={!tempLoc.country}
                      />
                    </div>
                    
                    {tempLoc.country && tempLoc.city && (
                      <div className="animate-in fade-in duration-300 space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Work Modes for {tempLoc.city}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {WORK_MODES.map(mode => {
                            const isSelected = tempWorkModes.includes(mode);
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => toggleTempWorkMode(mode)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                                  isSelected 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' 
                                    : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                                }`}
                              >
                                {mode} {isSelected && '✓'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button 
                      type="button" 
                      onClick={handleAddLocation} 
                      className="w-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white p-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                    >
                      Add Location
                    </button>
                 </div>
               </div>

               <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">Publish Vacancy</button>
             </form>
          </div>
        )}

        {view === 'profile' && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-300">
             <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">Company Profile</h2>
             <form onSubmit={handleUpdateProfile} className="space-y-8">
               <div className="space-y-4">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name</label>
                 <input 
                   type="text" 
                   className="w-full p-4 border dark:border-slate-600 rounded-2xl dark:bg-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                   value={companyName} 
                   onChange={e => setCompanyName(e.target.value)} 
                 />
               </div>

               <div className="space-y-4">
                 <Autocomplete 
                   label="Headquarters Location"
                   placeholder="e.g. San Francisco"
                   suggestions={CITIES}
                   selectedItems={companyLocation ? [companyLocation] : []}
                   onSelectionChange={(items) => setCompanyLocation(items[0] || '')}
                   singleSelect
                 />
               </div>

               <div className="space-y-4">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">About Company</label>
                 <textarea 
                   className="w-full p-4 border dark:border-slate-600 rounded-2xl h-40 dark:bg-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 resize-none" 
                   value={companyBio} 
                   onChange={e => setCompanyBio(e.target.value)} 
                   placeholder="Tell candidates about your mission and culture..."
                 />
               </div>

               <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">Update Profile</button>
             </form>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border dark:border-slate-700 space-y-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Invite Candidate</h3>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Select Vacancy</label>
                <select 
                  className="w-full p-4 border dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 dark:text-white outline-none"
                  value={inviteJobId}
                  onChange={(e) => setInviteJobId(e.target.value)}
                >
                  <option value="">Select a job...</option>
                  {myJobs.filter(j => j.active).map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-400 uppercase mb-2">Message (Optional)</label>
                 <textarea 
                   className="w-full p-4 border dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 dark:text-white h-24 resize-none outline-none"
                   placeholder="Hi, we'd love to chat..."
                   value={actionMessage}
                   onChange={(e) => setActionMessage(e.target.value)}
                 />
              </div>
              <div className="flex gap-3">
                <button onClick={confirmInvite} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black uppercase text-sm">Send Invite</button>
                <button onClick={() => setShowInviteModal(false)} className="px-6 bg-slate-100 text-slate-600 font-black uppercase text-sm rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Decline Modal */}
        {showDeclineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border dark:border-slate-700 space-y-6">
              <h3 className="text-xl font-black text-red-600">Decline Application</h3>
              <p className="text-slate-500 text-sm font-bold">Are you sure? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={confirmDecline} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black uppercase text-sm">Decline Candidate</button>
                <button onClick={() => setShowDeclineModal(false)} className="px-6 bg-slate-100 text-slate-600 font-black uppercase text-sm rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border dark:border-slate-700 space-y-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Schedule Interview</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Date</label>
                  <input 
                    type="date" 
                    className="w-full p-4 border dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 dark:text-white outline-none"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Time</label>
                  <input 
                    type="time" 
                    className="w-full p-4 border dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 dark:text-white outline-none"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={confirmSchedule} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-sm">Send Invite</button>
                <button onClick={() => setShowScheduleModal(false)} className="px-6 bg-slate-100 text-slate-600 font-black uppercase text-sm rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployerDashboard;
