
import React, { useState } from 'react';
import { Job, User, ApplicationStatus } from '../types';

interface Props {
  job: Job;
  currentUser: User;
  onApply?: (jobId: string, seekerId: string, note?: string) => void;
  onCloseJob?: (jobId: string) => void;
  applicationStatus?: ApplicationStatus;
  onBack: () => void;
}

const JobDetails: React.FC<Props> = ({ job, currentUser, onApply, onCloseJob, applicationStatus, onBack }) => {
  const hasApplied = !!applicationStatus;
  const isEmployer = currentUser.role === 'EMPLOYER';
  const isOwner = isEmployer && job.employerId === currentUser.id;
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyNote, setApplyNote] = useState('');

  const handleApplyClick = () => {
    setIsApplyModalOpen(true);
  };

  const confirmApply = () => {
    if (onApply) {
      onApply(job.id, currentUser.id, applyNote);
      setIsApplyModalOpen(false);
      setApplyNote('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 animate-in fade-in duration-300 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <button 
          onClick={onBack} 
          aria-label="Back to Dashboard"
          className="mb-6 flex items-center text-slate-500 hover:text-blue-600 transition-colors font-black uppercase text-xs tracking-widest"
        >
          ← Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Sidebar Actions - Mobile First */}
          <div className="lg:col-span-1 lg:order-last sticky top-4 lg:top-24 z-10">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Compensation</h3>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{job.salary.replace(/[kK]/g, '')}</p>
              </div>
              
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Posted</h3>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{new Date(job.postedAt).toLocaleDateString()}</p>
              </div>

              {!isEmployer && (
                <button 
                  onClick={handleApplyClick}
                  disabled={hasApplied || !job.active}
                  aria-label={
                    applicationStatus === ApplicationStatus.INVITED ? "Invited to Apply" : 
                    applicationStatus === ApplicationStatus.DECLINED ? "Application Declined" :
                    applicationStatus === ApplicationStatus.HIRED ? "Hired" :
                    applicationStatus === ApplicationStatus.OFFER ? "Job Offer Received" :
                    hasApplied ? "Already Applied" : 
                    !job.active ? "Vacancy Closed" : "Quick Apply"
                  }
                  className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-[0.98] ${
                    hasApplied 
                      ? applicationStatus === ApplicationStatus.INVITED ? 'bg-blue-100 text-blue-700' : 
                        applicationStatus === ApplicationStatus.DECLINED ? 'bg-red-100 text-red-700 cursor-not-allowed' :
                        applicationStatus === ApplicationStatus.HIRED ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed' :
                        applicationStatus === ApplicationStatus.OFFER ? 'bg-indigo-100 text-indigo-700 cursor-not-allowed' :
                        'bg-green-100 text-green-700 cursor-not-allowed' 
                      : !job.active 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
                  }`}
                >
                  {
                    applicationStatus === ApplicationStatus.INVITED ? 'Invited' : 
                    applicationStatus === ApplicationStatus.DECLINED ? 'Declined' :
                    applicationStatus === ApplicationStatus.HIRED ? 'Hired' :
                    applicationStatus === ApplicationStatus.OFFER ? 'Offer' :
                    hasApplied ? 'Applied' : 
                    !job.active ? 'Vacancy Closed' : 'Quick Apply'
                  }
                </button>
              )}

              {isOwner && job.active && (
                <button 
                  onClick={() => onCloseJob && onCloseJob(job.id)}
                  aria-label="Close Vacancy"
                  className="w-full py-4 rounded-2xl font-black text-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100"
                >
                  Close Vacancy
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2 break-words">{job.title}</h1>
              <p className="text-xl font-bold text-blue-600 mb-6">{job.companyName}</p>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {job.locations.map((loc, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase rounded-lg">
                    {loc.city}, {loc.country} <span className="text-blue-500">({loc.workModes.join(', ')})</span>
                  </span>
                ))}
                {job.experienceRequired === null ? (
                  <span className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-black uppercase rounded-lg">No Exp Required</span>
                ) : (
                  <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-black uppercase rounded-lg">{job.experienceRequired.amount} {job.experienceRequired.unit} exp</span>
                )}
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Job Mission</h3>
                {/<[a-z][\s\S]*>/i.test(job.description) ? (
                  <div 
                    className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg break-words overflow-wrap-anywhere"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                ) : (
                  <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed text-lg break-words overflow-wrap-anywhere">
                    {job.description}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Requirements</h3>
              <div className="flex flex-wrap gap-2">
                {job.requirements.map(req => (
                  <span key={req} className="px-4 py-2 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-600">
                    {req}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Apply Note Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border dark:border-slate-700 space-y-4">
             <h3 className="text-lg font-black text-slate-900 dark:text-white">Apply to {job.title}</h3>
             <p className="text-sm text-slate-500 font-bold">Add an optional message to the employer:</p>
             <textarea 
               className="w-full p-4 border dark:border-slate-600 rounded-2xl h-24 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none resize-none focus:ring-2 focus:ring-blue-500/50"
               placeholder="Hi, I'm interested in this role..."
               value={applyNote}
               onChange={(e) => setApplyNote(e.target.value)}
             />
             <div className="flex gap-2 pt-2">
               <button onClick={confirmApply} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-xs hover:bg-blue-700">
                 {applyNote.trim() ? "Send Message & Apply" : "Just Apply"}
               </button>
               <button onClick={() => setIsApplyModalOpen(false)} className="px-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-black uppercase text-xs rounded-xl hover:bg-slate-200">
                 Cancel
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
