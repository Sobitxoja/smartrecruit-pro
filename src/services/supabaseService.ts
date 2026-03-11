import { getSupabase } from '../lib/supabase';
import { User, Job, Application } from '../../types';

export const supabaseService = {
  // Users
  async getUsers(): Promise<User[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users from Supabase:', error);
      return [];
    }
    return data || [];
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching user by email:', error);
      return null;
    }
    return data || null;
  },

  async saveUser(user: User): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('Supabase client not initialized. User saved to local storage only.');
      return;
    }

    console.log('Attempting to save user to Supabase:', user.email);
    const { data, error } = await supabase
      .from('users')
      .upsert(user)
      .select();

    if (error) {
      console.error('Supabase Save Error (User):', error.message, error.details, error.hint);
      throw new Error(`Failed to save user to Supabase: ${error.message}`);
    } else {
      console.log('User successfully saved to Supabase:', data);
    }
  },

  // Jobs
  async getJobs(): Promise<Job[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('jobs')
      .select('*');

    if (error) {
      console.error('Error fetching jobs from Supabase:', error);
      return [];
    }
    return data || [];
  },

  async saveJob(job: Job): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    console.log('Attempting to save job to Supabase:', job.title);
    const { data, error } = await supabase
      .from('jobs')
      .upsert(job)
      .select();

    if (error) {
      console.error('Supabase Save Error (Job):', error.message, error.details, error.hint);
      throw new Error(`Failed to save job to Supabase: ${error.message}`);
    } else {
      console.log('Job successfully saved to Supabase:', data);
    }
  },

  // Applications
  async getApplications(): Promise<Application[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('applications')
      .select('*');

    if (error) {
      console.error('Error fetching applications from Supabase:', error);
      return [];
    }
    return data || [];
  },

  async saveApplication(app: Application): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    console.log('Attempting to save application to Supabase:', app.id);
    const { data, error } = await supabase
      .from('applications')
      .upsert(app)
      .select();

    if (error) {
      console.error('Supabase Save Error (Application):', error.message, error.details, error.hint);
      throw new Error(`Failed to save application to Supabase: ${error.message}`);
    } else {
      console.log('Application successfully saved to Supabase:', data);
    }
  },

  // Batch sync
  async syncAll(data: { users: User[], jobs: Job[], applications: Application[] }): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      if (data.users.length > 0) await supabase.from('users').upsert(data.users);
      if (data.jobs.length > 0) await supabase.from('jobs').upsert(data.jobs);
      if (data.applications.length > 0) await supabase.from('applications').upsert(data.applications);
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }
};
