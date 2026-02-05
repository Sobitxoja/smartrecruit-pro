
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { useNotification } from '../components/NotificationProvider';

interface Props {
  onAuthSuccess: (user: User) => void;
  onBack: () => void;
}

const Auth: React.FC<Props> = ({ onAuthSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const { notify } = useNotification();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !consent) {
      notify("You must agree to the data use and privacy policy to continue.", "warning");
      return;
    }
    if (!isLogin && !role) {
      notify("Please select your role.", "warning");
      return;
    }
    if (!isLogin && role === UserRole.EMPLOYER && !companyName.trim()) {
      notify("Company name is required for employers.", "warning");
      return;
    }

    const finalRole = isLogin 
      ? (email.toLowerCase().includes('employer') ? UserRole.EMPLOYER : UserRole.SEEKER) 
      : role!;

    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || (isLogin ? email.split('@')[0] : 'User'),
      email,
      role: finalRole,
      skills: [],
      experienceList: [],
      bio: '',
      companyName: finalRole === UserRole.EMPLOYER ? (isLogin ? 'Verified Enterprise' : companyName) : undefined
    };

    onAuthSuccess(mockUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors overflow-x-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button onClick={onBack} className="mb-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center font-black uppercase tracking-widest">
          ← Back to Home
        </button>
        <h2 className="text-center text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
          {isLogin ? 'Welcome Back' : 'Join SmartRecruit'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        {!isLogin && !role ? (
          <div className="space-y-6">
            <h3 className="text-center text-lg font-bold text-slate-600 dark:text-slate-400">Choose your account type</h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
              <button
                onClick={() => setRole(UserRole.SEEKER)}
                className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl shadow-sm transition-all group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎓</div>
                <span className="font-black text-slate-900 dark:text-white">Employee</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-2 font-bold uppercase tracking-widest leading-tight">Find opportunities</span>
              </button>
              <button
                onClick={() => setRole(UserRole.EMPLOYER)}
                className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl shadow-sm transition-all group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">💼</div>
                <span className="font-black text-slate-900 dark:text-white">Employer</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-2 font-bold uppercase tracking-widest leading-tight">Hire talent</span>
              </button>
            </div>
            <p className="text-center">
              <button onClick={() => setIsLogin(true)} className="text-blue-600 dark:text-blue-400 font-black hover:underline text-sm">Already have an account? Sign In</button>
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 py-10 px-6 sm:px-10 shadow-2xl border border-slate-200 dark:border-slate-700 sm:rounded-3xl transition-colors">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  {role === UserRole.EMPLOYER && (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-1">Company Name</label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Acme Innovations"
                        className="block w-full px-4 py-4 border border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full px-4 py-4 border border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-4 border border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-4 border border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                />
              </div>

              {!isLogin && (
                <div className="flex items-start p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center h-5">
                    <input
                      id="consent"
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="focus:ring-blue-500 h-5 w-5 text-blue-600 border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="ml-4 text-sm">
                    <label htmlFor="consent" className="font-black text-slate-700 dark:text-slate-300 uppercase text-[10px]">Ethical Data Consent</label>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold mt-1">I agree to the minimal data use for academic demonstration.</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-5 px-4 rounded-2xl shadow-xl text-lg font-black text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-[0.98] shadow-blue-200 dark:shadow-none"
              >
                {isLogin ? 'Sign In' : 'Complete Sign Up'}
              </button>
            </form>

            <div className="mt-10 flex justify-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setRole(null);
                  setCompanyName('');
                  setName('');
                }}
                className="text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:text-blue-600 transition-colors"
              >
                {isLogin ? "Need a new account?" : "Change role selection"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
