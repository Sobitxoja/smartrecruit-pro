import React, { useState, useEffect } from 'react';
import { Briefcase, FileText, User as UserIcon, LogOut, Search, Building, MapPin, Clock, DollarSign, ChevronRight, Filter, X, Check, MessageSquare } from 'lucide-react';
import { User, Job, Application, WorkExperience, JobLocation, ApplicationStatus } from '../types';
import JobDetails from './JobDetails';
import AppTour from '../components/AppTour';
import EmptyState from '../components/EmptyState';
import { COMMON_ROLES, COMMON_SKILLS, CITIES_BY_COUNTRY, COUNTRIES, WORK_MODES, MONTHS, YEARS } from '../constants';
import { useNotification } from '../components/NotificationProvider';
import Autocomplete from '../components/Autocomplete';
import ExpandableText from '../components/ExpandableText';
import ResumeUpload from '../components/ResumeUpload';

interface Props {
  user: User;
  jobs: Job[];
  applications: Application[];
  employers?: User[];
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onApply: (jobId: string, seekerId: string, note?: string) => void;
  onViewJob: (jobId: string) => void;
  onUpdateAppStatus: (appId: string, status: ApplicationStatus, message?: string) => void;
  onSendMessage: (appId: string, text: string, senderId: string, senderName: string) => void;
}

const JobCard = ({ job, application, onViewJob, onCompanyClick }: { job: Job, application?: Application, onViewJob: (id: string) => void, onCompanyClick: (id: string) => void }) => (
  <div onClick={() => onViewJob(job.id)} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{job.title}</h3>
        <p onClick={(e) => { e.stopPropagation(); onCompanyClick(job.employerId); }} className="text-sm text-slate-500 font-medium hover:text-blue-600 hover:underline">{job.companyName}</p>
      </div>
      {application && (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
          application.status === ApplicationStatus.INVITED ? 'bg-blue-100 text-blue-700' :
          application.status === ApplicationStatus.DECLINED ? 'bg-red-100 text-red-700' :
          application.status === ApplicationStatus.HIRED ? 'bg-emerald-100 text-emerald-700' :
          application.status === ApplicationStatus.OFFER ? 'bg-indigo-100 text-indigo-700' :
          'bg-green-100 text-green-700'
        }`}>
          {application.status === ApplicationStatus.INVITED ? 'Invited' :
           application.status === ApplicationStatus.DECLINED ? 'Declined' :
           application.status === ApplicationStatus.HIRED ? 'Hired' :
           application.status === ApplicationStatus.OFFER ? 'Offer' :
           'Applied'}
        </span>
      )}
    </div>
    <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-500 mb-4">
      <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg"><MapPin size={12} /> {job.locations[0]?.city}, {job.locations[0]?.country}</span>
      <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg">{job.salary.replace(/[kK]/g, '')}</span>
      <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg"><Clock size={12} /> {new Date(job.postedAt).toLocaleDateString()}</span>
    </div>
  </div>
);

const SeekerDashboard: React.FC<Props> = ({ user, jobs, applications, employers = [], onLogout, onUpdateUser, onApply, onViewJob, onUpdateAppStatus, onSendMessage }) => {
  const [view, setView] = useState<'jobs' | 'applied' | 'profile' | 'company'>('jobs');
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCompany, setActiveCompany] = useState<User | null>(null);
  const [appFilter, setAppFilter] = useState<'ALL' | ApplicationStatus>('ALL');
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState('');
  
  // Profile State
  const [profileName, setProfileName] = useState(user.name);
  const [preferredRole, setPreferredRole] = useState(user.preferredRole || '');
  const [preferredLocations, setPreferredLocations] = useState<JobLocation[]>(user.preferredLocations || []);
  const [tempLoc, setTempLoc] = useState<JobLocation>({ country: '', city: '', workModes: [] });
  const [tempWorkModes, setTempWorkModes] = useState<string[]>([]);
  const [openToRelocation, setOpenToRelocation] = useState(user.openToRelocation || false);
  const [profileBio, setProfileBio] = useState(user.bio || '');
  const [skillsList, setSkillsList] = useState<string[]>(user.skills || []);
  const [hasExperience, setHasExperience] = useState(!!user.experienceList?.length);
  const [experienceList, setExperienceList] = useState<WorkExperience[]>(user.experienceList || []);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const experienceFormRef = React.useRef<HTMLDivElement>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [tempExp, setTempExp] = useState<WorkExperience>({
    id: '', company: '', position: '', startMonth: '', startYear: '', endMonth: '', endYear: '', isCurrent: false, description: ''
  });

  const { notify } = useNotification();

  // Tour Logic
  const tourSteps = [
    { target: '#tour-nav-jobs', content: 'Browse and search for jobs here.' },
    { target: '#tour-nav-apps', content: 'Track your applications here.' },
    { target: '#tour-nav-dossier', content: 'Update your profile and resume here.' },
  ];
  
  const [runTour, setRunTour] = useState(false);
  
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenSeekerTour');
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, []);

  const handleTourFinish = () => {
    setRunTour(false);
    localStorage.setItem('hasSeenSeekerTour', 'true');
  };

  // Derived State
  const filteredJobs = jobs.filter(job => {
    if (!job.active) return false;
    const term = searchTerm.toLowerCase();
    return job.title.toLowerCase().includes(term) || 
           job.companyName.toLowerCase().includes(term) ||
           job.description.toLowerCase().includes(term);
  });

  const userApplications = applications.filter(app => app.seekerId === user.id);
  const filteredApps = userApplications.filter(app => appFilter === 'ALL' || app.status === appFilter);
  const activeApplication = activeAppId ? userApplications.find(a => a.id === activeAppId) : null;
  const activeAppJob = activeApplication ? jobs.find(j => j.id === activeApplication.jobId) : null;

  // Effects
  useEffect(() => {
    setProfileName(user.name);
    setPreferredRole(user.preferredRole || '');
    setPreferredLocations(user.preferredLocations || []);
    setOpenToRelocation(user.openToRelocation || false);
    setProfileBio(user.bio || '');
    setSkillsList(user.skills || []);
    setExperienceList(user.experienceList || []);
    setHasExperience(!!user.experienceList?.length);
  }, [user]);

  useEffect(() => {
    if (activeAppId && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeAppId, activeApplication?.messages]);

  // Handlers
  const handleCompanyClick = (employerId: string) => {
    const employer = employers.find(e => e.id === employerId);
    if (employer) {
      setActiveCompany(employer);
      setView('company');
    }
  };

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeAppId) return;
    onSendMessage(activeAppId, messageInput, user.id, user.name);
    setMessageInput('');
  };

  const handleDataExtracted = (data: any) => {
    if (data.name) setProfileName(data.name);
    if (data.email) { /* handle email if needed */ }
    if (data.skills) setSkillsList(prev => Array.from(new Set([...prev, ...data.skills])));
    if (data.experience) {
      const newExps = data.experience.map((exp: any) => ({
        ...exp,
        id: Math.random().toString(36).substr(2, 9)
      }));
      setExperienceList(prev => [...prev, ...newExps]);
      setHasExperience(true);
    }
    notify('Resume parsed successfully!', 'success');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: profileName,
      preferredRole,
      preferredLocations,
      openToRelocation,
      bio: profileBio,
      skills: skillsList,
      experienceList
    });
    notify('Profile updated successfully!', 'success');
  };

  const handleAddLocation = () => {
    if (tempLoc.country && tempLoc.city && tempWorkModes.length > 0) {
      setPreferredLocations([...preferredLocations, { ...tempLoc, workModes: tempWorkModes }]);
      setTempLoc({ country: '', city: '', workModes: [] });
      setTempWorkModes([]);
    }
  };

  const removeLocation = (index: number) => {
    const newLocs = [...preferredLocations];
    newLocs.splice(index, 1);
    setPreferredLocations(newLocs);
  };

  const toggleTempWorkMode = (mode: string) => {
    setTempWorkModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]);
  };

  const initAddExperience = () => {
    setIsAddingExperience(true);
    setEditingExperienceId(null);
    setTempExp({
      id: Math.random().toString(36).substr(2, 9),
      company: '', position: '', startMonth: '', startYear: '', endMonth: '', endYear: '', isCurrent: false, description: ''
    });
    setTimeout(() => experienceFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const editExperience = (exp: WorkExperience) => {
    setTempExp(exp);
    setEditingExperienceId(exp.id);
    setIsAddingExperience(true);
    setTimeout(() => experienceFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const deleteExperience = (id: string) => {
    setExperienceList(prev => prev.filter(e => e.id !== id));
  };

  const saveExperience = () => {
    if (!tempExp.company || !tempExp.position) return;
    
    if (editingExperienceId) {
      setExperienceList(prev => prev.map(e => e.id === editingExperienceId ? tempExp : e));
    } else {
      setExperienceList(prev => [...prev, tempExp]);
    }
    setIsAddingExperience(false);
    setEditingExperienceId(null);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-200 overflow-x-hidden max-w-full pb-20 md:pb-0">
      <AppTour run={runTour} steps={tourSteps} onFinish={handleTourFinish} />

      {/* Top Navigation - Desktop Only for Tabs */}
      <nav className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700 sticky top-0 z-40 transition-colors w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            <div className="flex items-center space-x-3 sm:space-x-10 overflow-hidden w-full sm:w-auto">
              <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter cursor-pointer select-none shrink-0" onClick={() => { setView('jobs'); setActiveCompany(null); setActiveAppId(null); }}>RecruitPro</span>
              
              {/* Desktop Tabs */}
              <div className="hidden md:flex space-x-1 sm:space-x-2">
                <button id="tour-nav-jobs" onClick={() => { setView('jobs'); setActiveAppId(null); }} aria-label="View Jobs" className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${view === 'jobs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Jobs</button>
                <button id="tour-nav-apps" onClick={() => { setView('applied'); }} aria-label="View Applications" className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${view === 'applied' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Applications</button>
                <button id="tour-nav-dossier" onClick={() => { setView('profile'); setActiveAppId(null); }} aria-label="View Profile" className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${view === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Dossier</button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={onLogout} aria-label="Logout" className="hidden md:block text-xs font-black text-red-600 uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">Logout</button>
              <button onClick={onLogout} aria-label="Logout" className="md:hidden p-2 text-red-600 hover:bg-red-50 rounded-full"><LogOut size={20} /></button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 w-full">

        {view === 'jobs' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 flex items-center">
              <span className="pl-4 text-slate-400">🔍</span>
              <input type="text" placeholder="Search vacancies, companies, or keywords..." className="w-full p-4 bg-transparent outline-none text-base sm:text-xl font-medium dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            
            {filteredJobs.length === 0 ? (
              <EmptyState 
                title="No jobs found" 
                description={searchTerm ? `We couldn't find any matches for "${searchTerm}". Try different keywords.` : "There are no active job listings at the moment."}
                icon="🔍"
              />
            ) : (
              <div className="grid gap-4">
                {filteredJobs.map(job => {
                  const application = applications.find(app => app.jobId === job.id && app.seekerId === user.id);
                  return (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      application={application} 
                      onViewJob={onViewJob} 
                      onCompanyClick={handleCompanyClick} 
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === 'applied' && !activeAppId && (
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">My Applications</h2>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button onClick={() => setAppFilter('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${appFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-500'}`}>All</button>
              <button onClick={() => setAppFilter(ApplicationStatus.INVITED)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${appFilter === ApplicationStatus.INVITED ? 'bg-green-600 text-white' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-500'}`}>Invited</button>
              <button onClick={() => setAppFilter(ApplicationStatus.DECLINED)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${appFilter === ApplicationStatus.DECLINED ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-500'}`}>Declined</button>
            </div>
            
            {filteredApps.length === 0 ? (
              <EmptyState 
                title="No applications yet" 
                description="You haven't applied to any jobs yet. Start exploring opportunities!" 
                actionLabel="Find Jobs" 
                onAction={() => setView('jobs')}
                icon="📝"
              />
            ) : (
              <div className="grid gap-4">
                {filteredApps.map(app => {
                  const job = jobs.find(j => j.id === app.jobId);
                  if (!job) return null;
                  return (
                    <div key={app.id} onClick={() => setActiveAppId(app.id)} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-blue-500 cursor-pointer shadow-sm transition-all group">
                       <div className="flex justify-between items-start">
                         <div>
                           <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{job.title}</h3>
                           <p className="text-blue-600 text-sm font-bold">{job.companyName}</p>
                         </div>
                         <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${app.status === ApplicationStatus.INVITED || app.status === ApplicationStatus.INTERVIEW ? 'bg-green-100 text-green-700' : app.status === ApplicationStatus.DECLINED ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                           {app.status}
                         </span>
                       </div>
                       <div className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                         <span>Last message: {app.messages.length > 0 ? new Date(app.messages[app.messages.length - 1].timestamp).toLocaleDateString() : 'N/A'}</span>
                         <span className="text-blue-500">Click to view chat →</span>
                       </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === 'applied' && activeApplication && activeAppJob && (
          <div className="h-[calc(100dvh-140px)] flex flex-col bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xl animate-in fade-in">
            {/* Chat Header */}
            <div className="p-4 sm:p-6 border-b dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-10 shadow-sm">
               <div>
                 <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{activeAppJob.title}</h2>
                 <p className="text-blue-600 text-xs sm:text-sm font-bold">{activeAppJob.companyName}</p>
               </div>
               <div className="flex gap-3">
                 <button onClick={() => setShowJobDetailsModal(true)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase hover:bg-slate-200 dark:hover:bg-slate-600">Vacancy Details</button>
                 <button onClick={() => setActiveAppId(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase hover:bg-slate-200 dark:hover:bg-slate-600">Back</button>
               </div>
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50">
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
                     <div className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed break-words overflow-wrap-anywhere ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-600'}`}>
                       {!isMe && <div className="text-[10px] font-black uppercase mb-1 opacity-50">{msg.senderName}</div>}
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

            {/* Chat Input */}
            {activeApplication.status !== ApplicationStatus.DECLINED && (
              <div className="p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
                <form onSubmit={handleSendMessageSubmit} className="flex gap-3">
                  <input 
                    className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-600 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                    placeholder="Type a message..." 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                  <button type="submit" className="px-6 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">Send</button>
                </form>
              </div>
            )}
          </div>
        )}

        {view === 'profile' && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-8">Professional Dossier</h2>
            
            <div className="mb-8">
              <ResumeUpload onDataExtracted={handleDataExtracted} />
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-10">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-4 border dark:border-slate-600 rounded-2xl dark:bg-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                  value={profileName} 
                  onChange={e => setProfileName(e.target.value)} 
                />

                <Autocomplete 
                  label="Preferred Role"
                  placeholder="Select or type your preferred role"
                  suggestions={COMMON_ROLES}
                  selectedItems={preferredRole ? [preferredRole] : []}
                  onSelectionChange={(items) => setPreferredRole(items[0] || '')}
                  singleSelect
                />

                {/* Location Selection with Work Modes */}
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                     Preferred Locations & Work Modes
                   </label>
                   
                   <div className="flex flex-wrap gap-2 mb-3">
                     {preferredLocations.map((loc, idx) => (
                       <span key={idx} className="bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-xl text-xs font-black border dark:border-slate-600 flex items-center dark:text-white">
                         {loc.city}, {loc.country} ({loc.workModes.join(', ')})
                         <button type="button" onClick={() => removeLocation(idx)} className="ml-2 text-red-500 hover:text-red-700">✕</button>
                       </span>
                     ))}
                   </div>

                   <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border dark:border-slate-700 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Autocomplete
                          label="Country"
                          placeholder="Select Country"
                          suggestions={COUNTRIES}
                          selectedItems={tempLoc.country ? [tempLoc.country] : []}
                          onSelectionChange={(items) => {
                            const newCountry = items[0] || '';
                            setTempLoc({ country: newCountry, city: '', workModes: [] });
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
                        Add Location Preference
                      </button>
                   </div>
                   
                   <label className="flex items-center space-x-2 cursor-pointer mt-4">
                     <input 
                       type="checkbox" 
                       className="rounded h-5 w-5 text-blue-600"
                       checked={openToRelocation} 
                       onChange={e => setOpenToRelocation(e.target.checked)} 
                     />
                     <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Open to Relocation (Anywhere On-site/Hybrid)</span>
                   </label>
                </div>

                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Bio & Summary</label>
                <textarea 
                  className="w-full p-4 border dark:border-slate-600 rounded-2xl h-32 dark:bg-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none" 
                  value={profileBio} 
                  onChange={e => setProfileBio(e.target.value)} 
                />
              </div>

              <div className="relative">
                <Autocomplete 
                  label="Technical Skills"
                  placeholder="Type to search skills..."
                  suggestions={COMMON_SKILLS}
                  selectedItems={skillsList}
                  onSelectionChange={setSkillsList}
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b dark:border-slate-700 pb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">History</label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded h-5 w-5 text-blue-600"
                      checked={!hasExperience} 
                      onChange={e => setHasExperience(!e.target.checked)} 
                    />
                    <span className="text-[10px] font-black text-slate-500 uppercase">No experience required</span>
                  </label>
                </div>

                {hasExperience && (
                  <div className="space-y-6">
                    {experienceList.map(exp => (
                      <div key={exp.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border dark:border-slate-700 relative hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-black text-slate-900 dark:text-white text-lg break-words">{exp.position}</h4>
                            <p className="text-blue-600 text-sm font-bold">{exp.company}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                              {exp.startMonth} {exp.startYear} — {exp.isCurrent ? "Present" : `${exp.endMonth} ${exp.endYear}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                             <button type="button" onClick={() => editExperience(exp)} className="text-blue-500 hover:text-blue-700 text-xs font-bold uppercase">Edit</button>
                             <button type="button" onClick={() => deleteExperience(exp.id)} className="text-red-400 hover:text-red-600 text-xs font-bold uppercase">Delete</button>
                          </div>
                        </div>
                        <ExpandableText text={exp.description} />
                      </div>
                    ))}

                    {isAddingExperience ? (
                      <div ref={experienceFormRef} className="p-6 sm:p-8 bg-blue-50 dark:bg-slate-900 rounded-3xl border-2 border-blue-200 dark:border-blue-900 space-y-6 animate-in slide-in-from-top-4">
                        <h4 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-wide border-b dark:border-slate-800 pb-2 mb-4">
                          {editingExperienceId ? "Update Experience" : "Add New Experience"}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Company Name</label>
                            <input 
                              placeholder="e.g. Acme Corp" 
                              className="w-full p-3.5 border dark:border-slate-600 rounded-2xl dark:bg-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[58px]" 
                              value={tempExp.company} 
                              onChange={e => setTempExp({...tempExp, company: e.target.value})} 
                            />
                          </div>
                          <Autocomplete 
                            label="Job Title"
                            placeholder="e.g. Product Manager"
                            suggestions={COMMON_ROLES}
                            selectedItems={tempExp.position ? [tempExp.position] : []}
                            onSelectionChange={(items) => setTempExp({...tempExp, position: items[0] || ''})}
                            singleSelect
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Start Date</label>
                              <div className="flex gap-2">
                                <select 
                                  value={tempExp.startMonth} 
                                  onChange={e => setTempExp({...tempExp, startMonth: e.target.value})}
                                  className="w-full p-4 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-white outline-none appearance-none cursor-pointer"
                                >
                                  <option value="">Month</option>
                                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select 
                                  value={tempExp.startYear} 
                                  onChange={e => setTempExp({...tempExp, startYear: e.target.value})}
                                  className="w-full p-4 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-white outline-none appearance-none cursor-pointer"
                                >
                                  <option value="">Year</option>
                                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                              </div>
                           </div>
                           
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase">End Date</label>
                              {tempExp.isCurrent ? (
                                <div className="w-full p-4 rounded-xl border dark:border-slate-600 bg-slate-200 dark:bg-slate-800/50 text-slate-500 font-bold flex items-center h-[58px]">
                                  Present
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <select 
                                    value={tempExp.endMonth} 
                                    onChange={e => setTempExp({...tempExp, endMonth: e.target.value})}
                                    className="w-full p-4 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-white outline-none appearance-none cursor-pointer"
                                  >
                                    <option value="">Month</option>
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                  <select 
                                    value={tempExp.endYear} 
                                    onChange={e => setTempExp({...tempExp, endYear: e.target.value})}
                                    className="w-full p-4 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-white outline-none appearance-none cursor-pointer"
                                  >
                                    <option value="">Year</option>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                  </select>
                                </div>
                              )}
                              <label className="flex items-center space-x-2 cursor-pointer pt-1">
                                <input 
                                  type="checkbox" 
                                  className="rounded h-4 w-4 text-blue-600"
                                  checked={tempExp.isCurrent} 
                                  onChange={e => setTempExp({...tempExp, isCurrent: e.target.checked})} 
                                />
                                <span className="text-[10px] font-bold text-slate-600 uppercase">Currently working here</span>
                              </label>
                           </div>
                        </div>

                        <textarea placeholder="Tell us about your impact and key achievements..." className="w-full p-4 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-white h-32 outline-none resize-none" value={tempExp.description} onChange={e => setTempExp({...tempExp, description: e.target.value})} />
                        
                        <div className="flex gap-4">
                          <button type="button" onClick={saveExperience} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-colors">
                            {editingExperienceId ? "Update Experience" : "Confirm Entry"}
                          </button>
                          <button type="button" onClick={() => setIsAddingExperience(false)} className="px-6 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={initAddExperience} className="w-full py-12 border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-slate-400 font-black uppercase text-xs tracking-widest hover:text-blue-500 hover:border-blue-200 transition-all">+ Add Track Record</button>
                    )}
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">Save Profile</button>
            </form>
          </div>
        )}

        {/* Company View */}
        {view === 'company' && activeCompany && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700">
              <button onClick={() => setView('jobs')} className="text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest mb-4 hover:underline">← Back to Vacancies</button>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6">{activeCompany.companyName}</h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{activeCompany.bio}</p>
            </div>
            <div className="grid gap-4">
               {jobs.filter(j => j.employerId === activeCompany.id && j.active).map(job => {
                 const application = applications.find(app => app.jobId === job.id && app.seekerId === user.id);
                 return (
                   <JobCard 
                     key={job.id} 
                     job={job} 
                     application={application} 
                     onViewJob={onViewJob} 
                     onCompanyClick={handleCompanyClick} 
                   />
                 );
               })}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-safe z-50">
        <div className="flex justify-around items-center h-16">
          <button 
            onClick={() => { setView('jobs'); setActiveAppId(null); }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === 'jobs' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <Briefcase size={24} strokeWidth={view === 'jobs' ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wide">Jobs</span>
          </button>
          
          <button 
            onClick={() => { setView('applied'); }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === 'applied' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <FileText size={24} strokeWidth={view === 'applied' ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wide">Apps</span>
          </button>
          
          <button 
            onClick={() => { setView('profile'); setActiveAppId(null); }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === 'profile' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <UserIcon size={24} strokeWidth={view === 'profile' ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wide">Dossier</span>
          </button>
        </div>
      </div>

      {/* Full Screen Job Details Modal from Chat */}
      {showJobDetailsModal && activeAppJob && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-y-auto animate-in fade-in">
           <JobDetails 
             job={activeAppJob} 
             currentUser={user} 
             applicationStatus={activeApplication?.status}
             onBack={() => setShowJobDetailsModal(false)}
           />
        </div>
      )}
    </div>
  );
};

export default SeekerDashboard;
