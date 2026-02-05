
import React, { useState, useEffect, useRef } from 'react';
import { User, Job, WorkExperience } from '../types';
import { useNotification } from '../components/NotificationProvider';

interface Props {
  user: User;
  jobs: Job[];
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

const COMMON_SKILLS = [
  "React", "JavaScript", "TypeScript", "Python", "Java", "AWS", "Docker", "Git", "Figma", "UI/UX Design", "SQL", "Cybersecurity",
  "Investment Banking", "Corporate Finance", "Accounting", "QuickBooks", "Risk Management", "Asset Management",
  "Nursing", "Patient Care", "Clinical Research", "Medical Coding", "Pharmacy",
  "SEO", "Social Media Marketing", "Content Strategy", "Salesforce", "Google Analytics", "Digital Marketing",
  "Customer Service", "Merchandising", "Event Planning", "Hotel Management",
  "Project Management", "Operations Management", "Strategic Thinking", "Agile Methodology", "Public Speaking", "Bilingual"
];

const SeekerDashboard: React.FC<Props> = ({ user, jobs, onLogout, onUpdateUser }) => {
  const [view, setView] = useState<'jobs' | 'profile' | 'company' | 'applied'>('jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeCompany, setActiveCompany] = useState<{name: string, id: string, bio: string} | null>(null);
  const [showCompanyJobs, setShowCompanyJobs] = useState(false);
  const { notify } = useNotification();
  
  const [profileName, setProfileName] = useState(user.name);
  const [profileBio, setProfileBio] = useState(user.bio || '');
  const [skillsList, setSkillsList] = useState<string[]>(user.skills || []);
  const [experienceList, setExperienceList] = useState<WorkExperience[]>(user.experienceList || []);
  const [hasExperience, setHasExperience] = useState(user.experienceList ? user.experienceList.length > 0 : true);

  const [skillInput, setSkillInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const skillInputRef = useRef<HTMLInputElement>(null);

  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [tempExp, setTempExp] = useState<Partial<WorkExperience>>({
    company: '', position: '', startDate: '', endDate: '', isCurrent: false, description: ''
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (skillInput.trim().length > 0) {
      const filtered = COMMON_SKILLS.filter(s => 
        s.toLowerCase().includes(skillInput.toLowerCase()) && 
        !skillsList.includes(s)
      ).slice(0, 8);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [skillInput, skillsList]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...user,
      name: profileName,
      bio: profileBio,
      skills: skillsList,
      experienceList: hasExperience ? experienceList : []
    };
    onUpdateUser(updatedUser);
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !skillsList.includes(skill.trim())) {
      setSkillsList([...skillsList, skill.trim()]);
      setSkillInput('');
      setSuggestions([]);
      skillInputRef.current?.focus();
    }
  };

  const saveExperience = () => {
    if (!tempExp.company || !tempExp.position || !tempExp.startDate) {
      notify("Please fill in Company, Position, and Start Date.", "warning");
      return;
    }

    const newExp: WorkExperience = {
      id: Math.random().toString(36).substr(2, 9),
      company: tempExp.company!,
      position: tempExp.position!,
      startDate: tempExp.startDate!,
      endDate: tempExp.isCurrent ? 'Present' : (tempExp.endDate || ''),
      isCurrent: tempExp.isCurrent || false,
      description: tempExp.description || ''
    };
    setExperienceList([...experienceList, newExp]);
    setTempExp({ company: '', position: '', startDate: '', endDate: '', isCurrent: false, description: '' });
    setIsAddingExperience(false);
    notify("Experience entry added", "success");
  };

  const handleApply = (jobId: string) => {
    if (user.appliedJobIds?.includes(jobId)) {
      notify("You have already applied for this position.", "info");
      return;
    }
    const updatedUser: User = {
      ...user,
      appliedJobIds: [...(user.appliedJobIds || []), jobId]
    };
    onUpdateUser(updatedUser);
    notify("Application submitted successfully!", "success");
    setSelectedJob(null);
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const appliedJobs = jobs.filter(job => user.appliedJobIds?.includes(job.id));

  const companyJobs = activeCompany ? jobs.filter(j => j.employerId === activeCompany.id) : [];

  const handleCompanyClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setActiveCompany({ 
      name: job.companyName, 
      id: job.employerId, 
      bio: `${job.companyName} is a global leader committed to pushing boundaries and fostering career growth.` 
    });
    setShowCompanyJobs(false);
    setView('company');
    window.scrollTo(0,0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'Present') return dateStr;
    try { return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }); }
    catch { return dateStr; }
  };

  const renderJobCard = (job: Job) => {
    const isApplied = user.appliedJobIds?.includes(job.id);
    return (
      <div 
        key={job.id} 
        onClick={() => setSelectedJob(job)}
        className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-2xl transition-all flex flex-col justify-between items-start gap-4 cursor-pointer group relative overflow-hidden active:scale-[0.99] sm:active:scale-100"
      >
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start w-full gap-2">
             <div className="flex items-center gap-3">
               <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight pr-4">{job.title}</h3>
               {isApplied && <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[8px] font-black uppercase rounded">Applied</span>}
             </div>
             <span className="text-lg font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">{job.salary}</span>
          </div>
          
          <button 
            onClick={(e) => handleCompanyClick(e, job)}
            className="text-blue-600 dark:text-blue-400 font-bold mb-4 hover:underline text-sm sm:text-base inline-block z-10 relative"
          >
            {job.companyName}
          </button>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {job.experienceRequired === null ? (
              <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[9px] font-black uppercase rounded-lg border border-green-100 dark:border-green-800/30">No experience required</span>
            ) : (
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[9px] font-black uppercase rounded-lg border border-blue-100 dark:border-blue-800/30">{job.experienceRequired.amount} {job.experienceRequired.unit} exp</span>
            )}
            {job.locations.map((loc, idx) => (
              <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[9px] font-black uppercase rounded-lg border border-slate-200 dark:border-slate-600">
                {loc.anywhere ? "Remote" : `${loc.city}, ${loc.country}`}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2 border-t dark:border-slate-700 pt-5">
            {job.requirements.map(req => (
              <span key={req} className="px-3 py-1 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-bold uppercase rounded-lg border dark:border-slate-600">{req}</span>
            ))}
          </div>
        </div>
        <div className="w-full flex justify-between items-center mt-2 border-t dark:border-slate-700 pt-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Details View</span>
          <button 
            onClick={(e) => { e.stopPropagation(); handleApply(job.id); }}
            disabled={isApplied}
            className={`px-8 py-3 rounded-2xl text-xs font-black transition-all active:scale-90 ${isApplied ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100 dark:shadow-none'}`}
          >
            {isApplied ? 'Applied' : 'Quick Apply'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-200 overflow-x-hidden max-w-full">
      <nav className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700 sticky top-0 z-40 transition-colors w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            <div className="flex items-center space-x-3 sm:space-x-10">
              <span 
                className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter cursor-pointer select-none" 
                onClick={() => { setView('jobs'); setActiveCompany(null); }}
              >
                RecruitPro
              </span>
              <div className="flex space-x-1 sm:space-x-2">
                <button 
                  onClick={() => { setView('jobs'); setActiveCompany(null); }} 
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'jobs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  Jobs
                </button>
                <button 
                  onClick={() => setView('applied')} 
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'applied' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  Applications
                </button>
                <button 
                  onClick={() => setView('profile')} 
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  Dossier
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={onLogout} className="text-[10px] sm:text-xs font-black text-red-600 uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 w-full">
        {view === 'jobs' ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 flex items-center">
              <span className="pl-4 text-slate-400">🔍</span>
              <input 
                type="text" 
                placeholder="Search vacancies, companies, or keywords..." 
                className="w-full p-4 bg-transparent outline-none text-base sm:text-xl font-medium dark:text-white" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            <div className="grid gap-4">
              {filteredJobs.map(job => renderJobCard(job))}
              {filteredJobs.length === 0 && (
                <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching results found.</p>
                </div>
              )}
            </div>
          </div>
        ) : view === 'applied' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">My Applications</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Tracking your career trajectory ({appliedJobs.length} active applications)</p>
              </div>
            </div>

            <div className="grid gap-4">
              {appliedJobs.map(job => renderJobCard(job))}
              {appliedJobs.length === 0 && (
                <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">You haven't applied to any vacancies yet.</p>
                  <button onClick={() => setView('jobs')} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">Browse Opportunities</button>
                </div>
              )}
            </div>
          </div>
        ) : view === 'company' && activeCompany ? (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <button 
              onClick={() => setView('jobs')} 
              className="px-4 py-2 text-slate-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
              ← Back to Board
            </button>
            
            <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
               <div className="h-40 sm:h-64 bg-gradient-to-br from-blue-700 via-indigo-600 to-slate-800 relative">
                  <div className="absolute -bottom-12 left-8 h-24 w-24 sm:h-32 sm:w-32 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex items-center justify-center text-4xl sm:text-5xl font-black text-blue-600 border-4 border-white dark:border-slate-800">
                    {activeCompany.name[0]}
                  </div>
               </div>
               
               <div className="p-8 pt-20">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-10">
                    <div>
                      <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-2">{activeCompany.name}</h2>
                      <div className="flex items-center gap-4">
                        <span className="text-blue-600 font-black text-xs uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">Verified Partner</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowCompanyJobs(!showCompanyJobs)}
                      className={`px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 ${showCompanyJobs ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 dark:shadow-none'}`}
                    >
                      {showCompanyJobs ? "Hide Vacancies" : "Show All Jobs"}
                    </button>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border dark:border-slate-700 mb-10">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Company Overview</h4>
                    <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed font-medium">
                      {activeCompany.bio}
                    </p>
                  </div>

                  {showCompanyJobs && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300 pt-6 border-t dark:border-slate-700">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Active Postings ({companyJobs.length})</h4>
                      <div className="grid gap-4">
                        {companyJobs.map(job => (
                          <div 
                            key={job.id} 
                            onClick={() => setSelectedJob(job)}
                            className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
                          >
                            <div>
                              <h5 className="text-xl font-black dark:text-white">{job.title}</h5>
                              <p className="text-sm font-bold text-blue-600 mt-1">{job.salary} • {job.locations.map(l => l.anywhere ? "Remote" : l.city).join(', ')}</p>
                            </div>
                            <span className="text-blue-600 font-black text-xs mt-4 sm:mt-0 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-xl">VIEW →</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-8">Professional Dossier</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-10">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-4 border dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                  value={profileName} 
                  onChange={e => setProfileName(e.target.value)} 
                />
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Bio & Summary</label>
                <textarea 
                  className="w-full p-4 border dark:border-slate-600 rounded-2xl h-32 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none" 
                  value={profileBio} 
                  onChange={e => setProfileBio(e.target.value)} 
                />
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Skills</label>
                <div className="relative">
                  <input 
                    ref={skillInputRef}
                    type="text" 
                    className="w-full p-4 border dark:border-slate-600 rounded-2xl dark:bg-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10" 
                    placeholder="Search skills (e.g. JavaScript)..." 
                    value={skillInput} 
                    onChange={e => setSkillInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput))}
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border dark:border-slate-700 overflow-hidden">
                      {suggestions.map(s => (
                        <button 
                          key={s} 
                          type="button" 
                          onClick={() => addSkill(s)} 
                          className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white text-sm font-bold border-b dark:border-slate-600 last:border-0"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {skillsList.map(skill => (
                    <span key={skill} className="flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-[10px] font-black uppercase rounded-xl border border-blue-100 dark:border-blue-800 dark:text-blue-300">
                      {skill}
                      <button type="button" onClick={() => setSkillsList(skillsList.filter(s => s !== skill))} className="ml-3 text-red-500">✕</button>
                    </span>
                  ))}
                </div>
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
                      <div key={exp.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border dark:border-slate-700 flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white text-lg">{exp.position}</h4>
                          <p className="text-blue-600 text-sm font-bold">{exp.company}</p>
                          <p className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-widest">{formatDate(exp.startDate)} — {formatDate(exp.endDate)}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">{exp.description}</p>
                        </div>
                        <button type="button" onClick={() => { setExperienceList(experienceList.filter(e => e.id !== exp.id)); notify("Entry removed"); }} className="text-red-400 p-2">✕</button>
                      </div>
                    ))}

                    {isAddingExperience ? (
                      <div className="p-6 sm:p-8 bg-blue-50 dark:bg-slate-900 rounded-3xl border-2 border-blue-200 dark:border-blue-900 space-y-6 animate-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <input placeholder="Company Name" className="p-4 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-white outline-none" value={tempExp.company} onChange={e => setTempExp({...tempExp, company: e.target.value})} />
                          <input placeholder="Job Title" className="p-4 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-white outline-none" value={tempExp.position} onChange={e => setTempExp({...tempExp, position: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Start Date</label>
                            <input 
                              type="date" 
                              max={today} 
                              className="w-full p-4 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-white select-none cursor-pointer" 
                              value={tempExp.startDate} 
                              onKeyDown={(e) => e.preventDefault()} 
                              onChange={e => setTempExp({...tempExp, startDate: e.target.value})} 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">End Date</label>
                            <input 
                              type="date" 
                              max={today} 
                              disabled={tempExp.isCurrent} 
                              className="w-full p-4 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-white disabled:opacity-30 cursor-pointer" 
                              value={tempExp.isCurrent ? '' : tempExp.endDate} 
                              onKeyDown={(e) => e.preventDefault()}
                              onChange={e => setTempExp({...tempExp, endDate: e.target.value})} 
                            />
                            <label className="flex items-center space-x-2 cursor-pointer mt-2">
                              <input 
                                type="checkbox" 
                                className="rounded h-4 w-4 text-blue-600"
                                checked={tempExp.isCurrent} 
                                onChange={e => setTempExp({...tempExp, isCurrent: e.target.checked})} 
                              />
                              <span className="text-[10px] font-bold text-slate-600 uppercase">I currently work here</span>
                            </label>
                          </div>
                        </div>
                        <textarea placeholder="Tell us about your impact and key achievements..." className="w-full p-4 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-white h-32 outline-none resize-none" value={tempExp.description} onChange={e => setTempExp({...tempExp, description: e.target.value})} />
                        <div className="flex gap-4">
                          <button type="button" onClick={saveExperience} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">Confirm Entry</button>
                          <button type="button" onClick={() => setIsAddingExperience(false)} className="px-6 text-slate-500 font-bold">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setIsAddingExperience(true)} className="w-full py-12 border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-slate-400 font-black uppercase text-xs tracking-widest hover:text-blue-500 hover:border-blue-200 transition-all">+ Add Track Record</button>
                    )}
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-blue-700 shadow-2xl transition-all active:scale-95 shadow-blue-200 dark:shadow-none">Save Profile</button>
            </form>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative p-6 sm:p-10 border border-slate-200 dark:border-slate-700 w-full">
            <button onClick={() => setSelectedJob(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white text-3xl font-black transition-colors">✕</button>
            
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3 leading-tight pr-8">{selectedJob.title}</h2>
              <button 
                onClick={(e) => { setSelectedJob(null); handleCompanyClick(e, selectedJob); }} 
                className="text-xl sm:text-2xl text-blue-600 font-bold hover:underline inline-block"
              >
                {selectedJob.companyName}
              </button>
            </div>
            
            <div className="space-y-8">
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proposed Salary</p>
                    <p className="text-xl font-black dark:text-white">{selectedJob.salary}</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Required Exp</p>
                    <p className="text-xl font-black dark:text-white">{selectedJob.experienceRequired ? `${selectedJob.experienceRequired.amount} ${selectedJob.experienceRequired.unit}` : 'None'}</p>
                 </div>
               </div>

               <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Job Mission</h4>
                  <div className="text-slate-700 dark:text-slate-300 whitespace-pre-line text-lg leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border dark:border-slate-700">
                    {selectedJob.description}
                  </div>
               </div>

               <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Core Competencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.requirements.map(req => (
                      <span key={req} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase rounded-xl border border-blue-100 dark:border-blue-800">{req}</span>
                    ))}
                  </div>
               </div>

               <div className="flex gap-4 pt-8 sticky bottom-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 mt-8 pb-2">
                 <button 
                  onClick={() => handleApply(selectedJob.id)} 
                  disabled={user.appliedJobIds?.includes(selectedJob.id)}
                  className={`flex-1 py-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all ${user.appliedJobIds?.includes(selectedJob.id) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 dark:shadow-none'}`}
                 >
                   {user.appliedJobIds?.includes(selectedJob.id) ? 'Already Applied' : 'Submit Application'}
                 </button>
                 <button onClick={() => setSelectedJob(null)} className="px-8 font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white">Close</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeekerDashboard;
