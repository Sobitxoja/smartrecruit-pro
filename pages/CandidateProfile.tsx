
import React, { useState } from 'react';
import { User, ApplicationStatus, Job, Application } from '../types';
import ExpandableText from '../components/ExpandableText';
import { useNotification } from '../components/NotificationProvider';

interface Props {
  candidate: User;
  onBack: () => void;
  onInvite?: (candidateId: string, jobId?: string) => void;
  matchScore?: number;
  availableJobs?: Job[]; // Jobs available for invitation
  applications?: Application[];
}

const CandidateProfile: React.FC<Props> = ({ candidate, onBack, onInvite, matchScore, availableJobs = [], applications = [] }) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const { notify } = useNotification();

  // Check if the candidate has been invited to ANY of the available jobs
  const isInvited = applications.some(app => 
    app.seekerId === candidate.id && 
    app.status === ApplicationStatus.INVITED &&
    availableJobs.some(job => job.id === app.jobId)
  );

  const handleInviteClick = () => {
    if (availableJobs.length === 0) {
      notify("You have no active jobs to invite this candidate to.", "warning");
      return;
    }
    // Filter out jobs already invited/applied
    const validJobs = availableJobs.filter(job => 
      !applications.some(app => app.jobId === job.id && app.seekerId === candidate.id)
    );

    if (validJobs.length === 0) {
      notify("Candidate has already been invited or applied to all your active jobs.", "warning");
      return;
    }

    // If only one job, select it automatically
    if (validJobs.length === 1) {
      setSelectedJobId(validJobs[0].id);
    } else {
      setSelectedJobId('');
    }
    setIsInviteModalOpen(true);
  };

  const confirmInvite = () => {
    if (!selectedJobId) return;
    if (onInvite) {
      onInvite(candidate.id, selectedJobId);
      setIsInviteModalOpen(false);
      setSelectedJobId('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 animate-in fade-in duration-300 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <button 
          onClick={onBack} 
          aria-label="Back to Talent Pool"
          className="mb-6 flex items-center text-slate-500 hover:text-blue-600 transition-colors font-black uppercase text-xs tracking-widest"
        >
          ← Back to Talent Pool
        </button>

        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32"></div>
          <div className="px-8 pb-8">
            <div className="relative flex flex-wrap justify-between items-end -mt-12 mb-6 gap-4">
               <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-3xl bg-white dark:bg-slate-800 p-2 shadow-xl">
                 <div className="h-full w-full bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-3xl sm:text-5xl font-black text-slate-400">
                   {candidate.name[0]}
                 </div>
               </div>
               {matchScore !== undefined && (
                 <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-black text-sm uppercase shadow-sm mb-2 sm:mb-0">
                   {matchScore}% AI Match
                 </div>
               )}
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2 break-words">{candidate.name}</h1>
            {candidate.preferredRole && (
              <p className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-1">{candidate.preferredRole}</p>
            )}
            <p className="text-blue-600 font-bold mb-6">{candidate.email}</p>

            <div className="flex flex-col gap-2">
               {candidate.preferredLocations && candidate.preferredLocations.length > 0 ? (
                 <div className="flex flex-wrap gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                   {candidate.preferredLocations.map((l, idx) => (
                     <span key={idx} className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
                       <span>📍</span>
                       {l.city}, {l.country} 
                       <span className="text-xs uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                         {l.workModes.join(', ')}
                       </span>
                     </span>
                   ))}
                 </div>
               ) : (
                 <p className="text-slate-400 italic">No preferred locations listed.</p>
               )}
               
               {candidate.openToRelocation && (
                 <span className="text-xs font-black text-green-600 uppercase tracking-widest mt-1">✓ Open to Relocation</span>
               )}
            </div>

            {onInvite && (
              <div className="mt-8 flex gap-4 pt-8 border-t dark:border-slate-700">
                 <button 
                   onClick={handleInviteClick} 
                   disabled={isInvited}
                   aria-label={isInvited ? "Candidate Invited" : "Invite to Apply"}
                   className={`flex-1 py-3 rounded-xl font-black uppercase tracking-wide transition-all ${
                      isInvited 
                        ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none'
                   }`}
                 >
                   {isInvited ? "Invited" : "Invite to Apply"}
                 </button>
              </div>
            )}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Summary */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Professional Summary</h3>
            <div className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words overflow-wrap-anywhere">
              {candidate.bio || "No summary provided."}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills && candidate.skills.length > 0 ? (
                candidate.skills.map(s => (
                  <span key={s} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold rounded-xl text-sm">
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">No skills listed.</span>
              )}
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Experience</h3>
            <div className="space-y-8">
              {candidate.experienceList && candidate.experienceList.length > 0 ? (
                candidate.experienceList.map(exp => (
                  <div key={exp.id} className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-700 last:mb-0">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-blue-600 border-4 border-white dark:border-slate-800"></div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white break-words">{exp.position}</h4>
                    <p className="text-blue-600 font-bold mb-1">{exp.company}</p>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                      {exp.startMonth} {exp.startYear} — {exp.isCurrent ? "Present" : `${exp.endMonth} ${exp.endYear}`}
                    </p>
                    <ExpandableText text={exp.description} className="text-slate-600 dark:text-slate-300" />
                  </div>
                ))
              ) : (
                <div className="text-slate-400 italic">No experience history available.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border dark:border-slate-700 space-y-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Select Job for Invitation</h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableJobs.filter(job => !applications.some(app => app.jobId === job.id && app.seekerId === candidate.id)).map(job => (
                <label key={job.id} className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedJobId === job.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300'}`}>
                  <input 
                    type="radio" 
                    name="jobInvite" 
                    value={job.id} 
                    checked={selectedJobId === job.id} 
                    onChange={() => setSelectedJobId(job.id)}
                    className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{job.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{job.locations.map(l => l.city).join(', ')}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={confirmInvite} 
                disabled={!selectedJobId}
                aria-label="Send Invitation"
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Send Invitation
              </button>
              <button 
                onClick={() => setIsInviteModalOpen(false)} 
                className="px-6 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black uppercase text-sm rounded-xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateProfile;
