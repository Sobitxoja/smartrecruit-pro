
import React from 'react';

interface Props {
  onGetStarted: () => void;
}

const Landing: React.FC<Props> = ({ onGetStarted }) => {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:px-8 lg:px-10">
        <main className="mx-auto max-w-3xl text-center">
          <div>
            <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
              <span className="block">A Smart Recruitment</span>
              <span className="block text-blue-600">Management System</span>
            </h1>
            <p className="mt-6 text-base text-slate-500 dark:text-slate-400 sm:text-lg md:text-xl">
              Bridging the gap between talent and opportunity. Our platform uses automated data processing to ensure the perfect match for every role.
            </p>
            <div className="mt-10 flex justify-center">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center justify-center px-10 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200/30"
              >
                Get Started
              </button>
            </div>
          </div>
        </main>

        <div className="mt-16">
          <img
            className="w-full rounded-3xl object-cover shadow-2xl brightness-90 dark:brightness-75"
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
            alt="Team collaboration"
          />
        </div>
      </div>

      <div className="py-12 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Objectives</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Solving Recruitment Challenges
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {[
                { name: 'Manual Screening Inefficiency', desc: 'Removing the bottleneck of traditional candidate evaluation.' },
                { name: 'Poor Matching', desc: 'Using AI to accurately match skills with job requirements.' },
                { name: 'Lack of Integration', desc: 'A unified platform for posting, applying, and tracking.' },
                { name: 'Complex Usability', desc: 'Designed with human-centric principles for effortless navigation.' },
              ].map((item) => (
                <div key={item.name} className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-slate-900 dark:text-white">{item.name}</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-slate-500 dark:text-slate-400">{item.desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
