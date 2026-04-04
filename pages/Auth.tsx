
import React, { useState } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, UserRole } from '../types';
import { useNotification } from '../components/NotificationProvider';
import Autocomplete from '../components/Autocomplete';
import { CITIES } from '../constants';
import { supabaseService } from '../src/services/supabaseService';
import { getSupabase } from '../src/lib/supabase';

interface Props {
  onAuthSuccess: (user: User) => void;
  onBack: () => void;
  initialView?: 'login' | 'signup';
}

// Validation Schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupStep1Schema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  consent: z.boolean().refine(val => val === true, { message: "You must agree to the terms" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const employerStep2Schema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  companyLocation: z.string().min(2, "Location is required"),
  companyWebsite: z.string().url("Invalid URL").optional().or(z.literal('')),
  companyDescription: z.string().optional(),
  companyWorkModes: z.array(z.string()).min(1, "Select at least one work mode"),
  consent: z.boolean().refine(val => val === true, { message: "You must agree to the terms" }),
});

type FormData = z.infer<typeof signupStep1Schema> & z.infer<typeof employerStep2Schema>;

const Auth: React.FC<Props> = ({ onAuthSuccess, onBack, initialView = 'signup' }) => {
  const [isLogin, setIsLogin] = useState(initialView === 'login');
  const [role, setRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Company Details (Employer only)
  
  const { notify } = useNotification();

  const { register, handleSubmit, formState: { errors }, trigger, watch, setValue, reset, getValues } = useForm<FormData>({
    resolver: zodResolver(
      isLogin 
        ? loginSchema 
        : (step === 1 ? signupStep1Schema : employerStep2Schema)
    ) as any,
    mode: 'onBlur',
    defaultValues: {
      companyWorkModes: [],
      consent: false
    }
  });

  const email = watch('email');
  const password = watch('password');
  const companyWorkModes = watch('companyWorkModes') || [];

  const handleWorkModeToggle = (mode: string) => {
    const current = companyWorkModes;
    const updated = current.includes(mode) 
      ? current.filter(m => m !== mode) 
      : [...current, mode];
    setValue('companyWorkModes', updated, { shouldValidate: true });
  };

  const onInvalid = (errors: FieldErrors<FormData>) => {
    notify("Please check the form for errors.", "error");
  };

  const onSubmit = async (data: FormData) => {
    const supabase = getSupabase();
    if (!supabase) {
      notify("Supabase is not configured.", "error");
      return;
    }

    // Merge current step data with previous step data stored in form state
    const fullData = { ...getValues(), ...data };

    if (isLogin) {
      // Real Login Logic via Supabase Auth
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: fullData.email,
          password: fullData.password,
        });

        if (authError) {
          notify(authError.message, "error");
          return;
        }

        if (authData.user) {
          const existingUser = await supabaseService.getUserByEmail(fullData.email);
          if (existingUser) {
            onAuthSuccess(existingUser);
            notify(`Welcome back, ${existingUser.name}!`, "success");
          } else {
            notify("User profile not found in database.", "error");
          }
        }
      } catch (err) {
        console.error('Login error:', err);
        notify("An error occurred during login.", "error");
      }
      return;
    }

    // Registration Logic
    try {
      const existingUser = await supabaseService.getUserByEmail(fullData.email);
      if (existingUser) {
        notify("An account with this email already exists. Please sign in.", "warning");
        return;
      }
    } catch (err) {
      console.error('Check user error:', err);
    }

    if (role === UserRole.EMPLOYER && step === 1) {
      setStep(2);
      return;
    }

    // Final Submission - Create the user profile in the 'users' table
    // Sign up with Supabase Auth (assuming email confirmation is disabled)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: fullData.email,
        password: fullData.password,
      });

      if (signUpError) {
        notify(signUpError.message, "error");
        return;
      }
    } catch (err) {
      console.error('Sign up error:', err);
      notify("Failed to create account.", "error");
      return;
    }

    // Get the current user from auth
    let authUserId: string;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      authUserId = authUser.id;
    } else {
      // Fallback: generate a mock UID if user is not immediately available
      authUserId = 'user-' + Math.random().toString(36).substr(2, 9);
    }

    const mockUser: User = {
      id: authUserId, // Use Auth UID or Mock UID
      name: fullData.name,
      email: fullData.email,
      password: fullData.password,
      role: role!,
      isVerified: true,
      skills: [],
      experienceList: [],
      bio: role === UserRole.EMPLOYER ? fullData.companyDescription : '',
      companyName: role === UserRole.EMPLOYER ? fullData.companyName : undefined,
      companyLocation: role === UserRole.EMPLOYER ? fullData.companyLocation : undefined,
      companyWebsite: role === UserRole.EMPLOYER ? fullData.companyWebsite : undefined,
      companyWorkModes: role === UserRole.EMPLOYER ? fullData.companyWorkModes : undefined,
    };

    try {
      await supabaseService.saveUser(mockUser);
      onAuthSuccess(mockUser);
      notify("Account created successfully!", "success");
    } catch (err: any) {
      console.error('Signup error:', err);
      notify(err.message || "Failed to create account.", "error");
    }
  };

  const resetToRoleSelection = () => {
    setIsLogin(false);
    setRole(null);
    setStep(1);
    reset();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col py-12 px-4 sm:px-6 lg:px-8 transition-colors overflow-x-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md my-auto">
        <button onClick={onBack} aria-label="Back to Home" className="mb-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center font-black uppercase tracking-widest">
          ← Back to Home
        </button>
        <h2 className="text-center text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
          {isLogin ? 'Welcome Back' : (role === UserRole.EMPLOYER && step === 2 ? 'Company Details' : 'Join SmartRecruit')}
        </h2>
        {!isLogin && role && (
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            {role === UserRole.EMPLOYER ? (step === 1 ? 'Step 1 of 2: Account Info' : 'Step 2 of 2: Company Info') : 'Create your account'}
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        {!isLogin && !role ? (
          <div className="space-y-6">
            <h3 className="text-center text-lg font-bold text-slate-600 dark:text-slate-400">Choose your account type</h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
              <button
                onClick={() => setRole(UserRole.SEEKER)}
                aria-label="Select Employee Role"
                className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl shadow-sm transition-all group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎓</div>
                <span className="font-black text-slate-900 dark:text-white">Employee</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-2 font-bold uppercase tracking-widest leading-tight">Find opportunities</span>
              </button>
              <button
                onClick={() => setRole(UserRole.EMPLOYER)}
                aria-label="Select Employer Role"
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
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit, onInvalid)}>
              
              {/* Login Form or Registration Step 1 */}
              {(isLogin || step === 1) && (
                <>
                  {!isLogin && (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        {...register('name')}
                        className={`block w-full px-4 py-4 border rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">
                      {role === UserRole.EMPLOYER && !isLogin ? 'Work Email Address' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      placeholder={role === UserRole.EMPLOYER && !isLogin ? "name@company.com" : "name@example.com"}
                      className={`block w-full px-4 py-4 border rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none ${errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">Password</label>
                    <input
                      type="password"
                      {...register('password')}
                      className={`block w-full px-4 py-4 border rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none ${errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                  </div>

                  {!isLogin && (
                    <>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-1">Confirm Password</label>
                        <input
                          type="password"
                          {...register('confirmPassword')}
                          className={`block w-full px-4 py-4 border rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Employer Step 2 */}
              {!isLogin && role === UserRole.EMPLOYER && step === 2 && (
                <>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">Company Name</label>
                    <input
                      type="text"
                      {...register('companyName')}
                      placeholder="e.g. Acme Innovations"
                      className={`block w-full px-4 py-4 border rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none ${errors.companyName ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                    />
                    {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                  </div>

                  <div>
                    <Autocomplete
                      label="Company Location"
                      placeholder="e.g. San Francisco"
                      suggestions={CITIES}
                      selectedItems={watch('companyLocation') ? [watch('companyLocation')] : []}
                      onSelectionChange={(items) => setValue('companyLocation', items[0] || '', { shouldValidate: true })}
                      singleSelect
                    />
                    {errors.companyLocation && <p className="text-red-500 text-xs mt-1">{errors.companyLocation.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">Work Modes Offered</label>
                    <div className="flex flex-wrap gap-2">
                      {['On-site', 'Remote', 'Hybrid'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => handleWorkModeToggle(mode)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                            companyWorkModes.includes(mode)
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-500'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                    {errors.companyWorkModes && <p className="text-red-500 text-xs mt-1">{errors.companyWorkModes.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">Company Website (Optional)</label>
                    <input
                      type="url"
                      {...register('companyWebsite')}
                      placeholder="https://example.com"
                      className={`block w-full px-4 py-4 border rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none ${errors.companyWebsite ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'}`}
                    />
                    {errors.companyWebsite && <p className="text-red-500 text-xs mt-1">{errors.companyWebsite.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">Company Description (Optional)</label>
                    <textarea
                      {...register('companyDescription')}
                      rows={3}
                      className="block w-full px-4 py-4 border border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"
                    />
                  </div>
                </>
              )}

              {!isLogin && (
                <div className="flex items-start p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center h-5">
                    <input
                      id="consent"
                      type="checkbox"
                      {...register('consent')}
                      className="focus:ring-blue-500 h-5 w-5 text-blue-600 border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="ml-4 text-sm">
                    <label htmlFor="consent" className="font-black text-slate-700 dark:text-slate-300 uppercase text-[10px]">Ethical Data Consent</label>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold mt-1">I agree to the minimal data use for academic demonstration.</p>
                    {errors.consent && <p className="text-red-500 text-xs mt-1">{errors.consent.message}</p>}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                {!isLogin && role === UserRole.EMPLOYER && step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-5 px-4 rounded-2xl shadow-sm text-lg font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-[0.98]"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-5 px-4 rounded-2xl shadow-xl text-lg font-black text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-[0.98] shadow-blue-200 dark:shadow-none"
                >
                  {isLogin ? 'Sign In' : (role === UserRole.EMPLOYER && step === 1 ? 'Next Step' : 'Complete Sign Up')}
                </button>
              </div>
            </form>

            <div className="mt-10 flex flex-col items-center gap-4">
              <button
                onClick={resetToRoleSelection}
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