import { User, Job, Application } from '../types';

const STORAGE_KEYS = {
  USERS: 'recruitpro_users',
  JOBS: 'recruitpro_jobs',
  APPLICATIONS: 'recruitpro_applications',
  THEME: 'recruitpro_theme',
  CURRENT_USER: 'recruitpro_current_user',
};

export const storageService = {
  // Users
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },
  addUser: (user: User) => {
    const users = storageService.getUsers();
    users.push(user);
    storageService.saveUsers(users);
  },
  updateUser: (updatedUser: User) => {
    const users = storageService.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      storageService.saveUsers(users);
    }
    // Also update current user if it matches
    const currentUser = storageService.getCurrentUser();
    if (currentUser && currentUser.id === updatedUser.id) {
      storageService.saveCurrentUser(updatedUser);
    }
  },

  // Jobs
  getJobs: (): Job[] => {
    const data = localStorage.getItem(STORAGE_KEYS.JOBS);
    return data ? JSON.parse(data) : [];
  },
  saveJobs: (jobs: Job[]) => {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  },
  saveJob: (job: Job) => {
    const jobs = storageService.getJobs();
    const index = jobs.findIndex(j => j.id === job.id);
    if (index !== -1) {
      jobs[index] = job;
    } else {
      jobs.push(job);
    }
    storageService.saveJobs(jobs);
  },

  // Applications
  getApplications: (): Application[] => {
    const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    return data ? JSON.parse(data) : [];
  },
  saveApplications: (apps: Application[]) => {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  },

  // Theme
  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light';
  },
  saveTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  // Session
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },
  saveCurrentUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
};
