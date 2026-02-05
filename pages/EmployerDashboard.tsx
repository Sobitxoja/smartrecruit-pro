
import React, { useState } from 'react';
import { User, Job, JobLocation, MatchResult } from '../types';
import { getSmartMatch } from '../services/geminiService';
import { useNotification } from '../components/NotificationProvider';

interface Props {
  user: User;
  jobs: Job[];
  seekers: User[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  onLogout: () => void;
}

const EmployerDashboard: React.FC<Props> = ({ user, jobs, seekers, setJobs, onLogout }) => {
  const [view, setView] = useState<'listings' | 'post' | 'candidates'>('listings');
  const [matchingStatus, setMatchingStatus] = useState<string>('');
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [activeJobForMatching, setActiveJobForMatching] = useState<Job | null>(null);
  const [selectedSeeker, setSelectedSeeker] = useState<User | null>(null);
  const { notify } = useNotification();
  
  const [newJob, setNewJob] = useState({ 
    title: '', 
    description: '', 
    requirements: '', 
    salary: '',
    isEntryLevel: true,
    expAmount: 0,
    expUnit: 'years' as 'months' | 'years',
    locations: [] as JobLocation[]
  });

  const [tempLoc, setTempLoc] = useState<JobLocation>({ type: 'on-site', country: '', city: '', anywhere: false });

  const handleAddLocation = () => {
    if (!tempLoc.anywhere && (!tempLoc.country || !tempLoc.city)) {
      notify("Please enter a Country and City or select 'Everywhere'.", "warning");
      return;
    }
    setNewJob(prev => ({ ...prev, locations: [...prev.locations, tempLoc] }));
    setTempLoc({ type: 'on-site', country: '', city: '', anywhere: false });
    notify("Location added successfully", "success");
  };

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (newJob.locations.length === 0) {
      notify("Please add at least one location before publishing.", "error");
      return;
    }

    const formattedSalary = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(Number(newJob.salary));

    const job: Job = {
      id: Math.random().toString(36).substr(2, 9),
      employerId: user.id,
      companyName: user.companyName || 'Verified Enterprise',
      title: newJob.title,
      description: newJob.description,
      requirements: newJob.requirements.split(',').map(s => s.trim()).filter(s => s !== ''),
      salary: formattedSalary,
      postedAt: new Date().toISOString(),
      experienceRequired: newJob.isEntryLevel ? null : { amount: newJob.expAmount, unit: newJob.expUnit },
      locations: newJob.locations
    };
    setJobs([job, ...jobs]);
    setView('listings');
    notify("Job opportunity published!", "success");
    setNewJob({ 
      title: '', description: '', requirements: '', salary: '', 
      isEntryLevel: true, expAmount: 0, expUnit: 'years', locations: [] 
    });
  };

  const handleSmartMatch = async (job: Job) => {
    setActiveJobForMatching(job);
    setMatchingStatus('AI is analyzing candidate pool...');
    setMatchResults([]);
    try {
      const results = await getSmartMatch(job, seekers);
      setMatchResults(results);
    } catch (err) {
      notify("AI Matching failed. Please try again.", "error");
    } finally {
      setMatchingStatus('');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'Present') return dateStr;
    try { return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }); }
    catch { return dateStr; }
  };

  const myJobs = jobs.filter(j => j.employerId === user.id || j.companyName === user.companyName);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-200 overflow-x-hidden w-full">
      <nav className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700 sticky top-0 z-40 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight cursor-pointer" onClick={() => setView('listings')}>RecruitPro</span>
              <div className="flex space-x-1 sm:space-x-2">
                <button onClick={() => setView('listings')} className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-sm font-bold transition-all ${view === 'listings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>My Jobs</button>
                <button onClick={() => setView('post')} className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-sm font-bold transition-all ${view === 'post' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Post</button>
                <button onClick={() => setView('candidates')} className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-sm font-bold transition-all ${view === 'candidates' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Talent</button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase hidden sm:block">{user.companyName}</span>
              <button onClick={onLogout} className="text-[10px] sm:text-xs font-black text-red-600 uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-red-50 transition-all">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {view === 'post' ? (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Post New Vacancy</h2>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Publishing as</p>
                <p className="text-sm font-black text-blue-600">{user.companyName}</p>
              </div>
            </div>
            <form onSubmit={handlePostJob} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Job Title</label>
                <input required placeholder="e.g. Senior Product Designer" className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} />
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border dark:border-slate-700">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-4">Experience Policy</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="radio" checked={newJob.isEntryLevel} onChange={() => setNewJob({...newJob, isEntryLevel: true})} className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-bold dark:text-white">No experience required</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="radio" checked={!newJob.isEntryLevel} onChange={() => setNewJob({...newJob, isEntryLevel: false})} className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-bold dark:text-white">Experience required</span>
                  </label>
                </div>
                {!newJob.isEntryLevel && (
                  <div className="mt-6 flex items-center space-x-4 animate-in slide-in-from-top-2">
                    <div className="flex flex-col">
                       <label className="text-[9px] text-slate-400 uppercase mb-1 font-black">Amount</label>
                       <input type="number" min="1" className="w-24 p-4 border dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white outline-none" value={newJob.expAmount} onChange={e => setNewJob({...newJob, expAmount: parseInt(e.target.value)})} />
                    </div>
                    <div className="flex flex-col flex-1 max-w-[150px]">
                       <label className="text-[9px] text-slate-400 uppercase mb-1 font-black">Unit</label>
                       <select className="p-4 border dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white outline-none" value={newJob.expUnit} onChange={e => setNewJob({...newJob, expUnit: e.target.value as 'months' | 'years'})}>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                       </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border dark:border-slate-700">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-4">Work locations</label>
                <div className="space-y-3 mb-6">
                  {newJob.locations.map((loc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm animate-in zoom-in-95">
                      <div className="flex items-center text-sm dark:text-white font-bold">
                        <span className="mr-2 text-blue-500">📍</span>
                        {loc.anywhere ? "Global Remote" : `${loc.city}, ${loc.country} (${loc.type})`}
                      </div>
                      <button type="button" onClick={() => setNewJob(prev => ({...prev, locations: prev.locations.filter((_, i) => i !== idx)}))} className="text-red-500 p-2">✕</button>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-dashed dark:border-slate-700 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <select className="p-3 border dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white outline-none" value={tempLoc.type} onChange={e => setTempLoc({...tempLoc, type: e.target.value as any})}>
                      <option value="on-site">On-Site</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                    <label className="flex items-center space-x-2 cursor-pointer p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <input type="checkbox" checked={tempLoc.anywhere} onChange={e => setTempLoc({...tempLoc, anywhere: e.target.checked})} className="rounded text-blue-600 h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase dark:text-white">Everywhere</span>
                    </label>
                  </div>
                  {!tempLoc.anywhere && (
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Country" className="p-3 border dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white outline-none" value={tempLoc.country} onChange={e => setTempLoc({...tempLoc, country: e.target.value})} />
                      <input placeholder="City" className="p-3 border dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white outline-none" value={tempLoc.city} onChange={e => setTempLoc({...tempLoc, city: e.target.value})} />
                    </div>
                  )}
                  <button type="button" onClick={handleAddLocation} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-colors shadow-lg active:scale-95">Add Location</button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Description</label>
                <textarea required className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-2xl h-48 bg-white dark:bg-slate-700 dark:text-white outline-none resize-none focus:ring-4 focus:ring-blue-500/10" value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Requirements (comma separated)</label>
                  <input required placeholder="React, Node.js, SQL" className="w-full p-4 border dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10" value={newJob.requirements} onChange={e => setNewJob({...newJob, requirements: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Annual Salary Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input 
                      type="number" 
                      required 
                      placeholder="e.g. 120000" 
                      className="w-full pl-8 p-4 border dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      value={newJob.salary} 
                      onChange={e => setNewJob({...newJob, salary: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl active:scale-95 shadow-blue-200 dark:shadow-none">Publish Opportunity</button>
            </form>
          </div>
        ) : view === 'candidates' ? (
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Global Talent Pool</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {seekers.map(seeker => (
                <div 
                  key={seeker.id} 
                  onClick={() => setSelectedSeeker(seeker)}
                  className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-blue-500 transition-all cursor-pointer group active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-5 mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg group-hover:scale-110 transition-transform">{seeker.name[0]}</div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-none mb-1 group-hover:text-blue-600 transition-colors">{seeker.name}</h4>
                      <p className="text-sm text-slate-500 font-medium">{seeker.email}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Core Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {seeker.skills?.slice(0, 5).map(s => <span key={s} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase rounded-lg border dark:border-slate-600">{s}</span>)}
                        {(seeker.skills?.length || 0) > 5 && <span className="text-[10px] font-black text-slate-400 uppercase">+{seeker.skills!.length - 5} more</span>}
                      </div>
                    </div>
                    {seeker.experienceList && seeker.experienceList.length > 0 && (
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Professional Track</p>
                        <div className="mb-4 pl-4 border-l-2 border-blue-500">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{seeker.experienceList[0].position}</p>
                          <p className="text-xs text-blue-600 font-medium">{seeker.experienceList[0].company}</p>
                        </div>
                      </div>
                    )}
                    <div className="pt-4 border-t dark:border-slate-700 text-center">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Click to view full dossier →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Active Postings</h2>
              {myJobs.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-16 text-center rounded-3xl border-4 border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-400 font-bold mb-4">No vacancies currently active.</p>
                  <button onClick={() => setView('post')} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg">Post Now</button>
                </div>
              ) : myJobs.map(job => (
                <div key={job.id} className={`bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border-2 transition-all ${activeJobForMatching?.id === job.id ? 'border-blue-500 ring-8 ring-blue-50 dark:ring-blue-900/10' : 'border-slate-100 dark:border-slate-700'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{job.title}</h4>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">{job.locations.map(l => l.anywhere ? "Remote" : l.city).join(' / ')}</p>
                      <div className="mt-3">
                        {job.experienceRequired ? (
                          <span className="text-[10px] font-black text-blue-500 uppercase">{job.experienceRequired.amount} {job.experienceRequired.unit} REQUIRED</span>
                        ) : (
                          <span className="text-[10px] font-black text-green-500 uppercase">No experience required</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleSmartMatch(job)} className="bg-blue-600 text-white px-6 py-4 rounded-2xl text-xs font-black hover:bg-blue-700 shadow-xl transition-all active:scale-95">Match AI</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 min-h-[500px] border border-slate-200 dark:border-slate-700 shadow-2xl">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center mb-8">
                <span className="mr-3">🪄</span> Match Intelligence
              </h2>
              {matchingStatus && (
                <div className="flex flex-col items-center justify-center h-80">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-6"></div>
                  <p className="text-blue-600 font-black animate-pulse uppercase tracking-widest text-xs">{matchingStatus}</p>
                </div>
              )}
              {!matchingStatus && matchResults.length > 0 && (
                <div className="space-y-6">
                  {matchResults.sort((a,b) => b.score - a.score).map(res => {
                    const candidate = seekers.find(c => c.id === res.candidateId);
                    return (
                      <div 
                        key={res.candidateId} 
                        onClick={() => candidate && setSelectedSeeker(candidate)}
                        className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border-l-8 border-green-500 shadow-sm animate-in slide-in-from-right-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-black text-slate-900 dark:text-white text-lg leading-none">{candidate?.name}</span>
                          <span className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-xl text-xs font-black">{res.score}% MATCH</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">"{res.reasoning}"</p>
                      </div>
                    );
                  })}
                </div>
              )}
              {!matchingStatus && matchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center h-80 text-center">
                  <div className="text-6xl mb-6 opacity-10">🔬</div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select a vacancy to run AI candidate analysis</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Candidate Profile Modal */}
      {selectedSeeker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative border border-slate-200 dark:border-slate-700">
            <button onClick={() => setSelectedSeeker(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white text-3xl font-black transition-colors z-10">✕</button>
            
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 w-full relative">
               <div className="absolute -bottom-10 left-8 h-24 w-24 bg-white dark:bg-slate-900 rounded-3xl border-4 border-white dark:border-slate-800 flex items-center justify-center text-4xl font-black text-blue-600 shadow-xl">
                 {selectedSeeker.name[0]}
               </div>
            </div>

            <div className="p-8 pt-14 space-y-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-none">{selectedSeeker.name}</h2>
                <p className="text-blue-600 font-bold mt-2 text-sm">{selectedSeeker.email}</p>
              </div>

              {selectedSeeker.bio && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Bio & Professional Summary</h4>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border dark:border-slate-700">
                    <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed font-medium">
                      {selectedSeeker.bio}
                    </p>
                  </div>
                </div>
              )}

              {selectedSeeker.skills && selectedSeeker.skills.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Technical Competencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeeker.skills.map(skill => (
                      <span key={skill} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px] font-black uppercase rounded-xl border border-blue-100 dark:border-blue-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Work Experience</h4>
                {selectedSeeker.experienceList && selectedSeeker.experienceList.length > 0 ? (
                  <div className="space-y-6">
                    {selectedSeeker.experienceList.map(exp => (
                      <div key={exp.id} className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-700">
                        <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-blue-600 border-4 border-white dark:border-slate-800 shadow-sm"></div>
                        <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border dark:border-slate-700">
                          <h5 className="font-black text-slate-900 dark:text-white text-lg">{exp.position}</h5>
                          <p className="text-blue-600 font-bold text-sm mb-1">{exp.company}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3">
                            {formatDate(exp.startDate)} — {formatDate(exp.endDate)}
                          </p>
                          {exp.description && (
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed italic">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No detailed experience provided.</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800 pb-2">
                <button 
                  onClick={() => { notify(`Message sent to ${selectedSeeker.name}`, 'info'); setSelectedSeeker(null); }}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-200 dark:shadow-none active:scale-95 transition-all"
                >
                  Contact Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
