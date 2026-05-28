export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  completedAt?: string | null;
}

export type View = 'home' | 'tasks' | 'focus' | 'vox' | 'settings' | 'history' | 'about' | 'app-info' | 'privacy' | 'guide' | 'company-profile' | 'blueprint' | 'system-status';

export interface FocusSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  type: 'work' | 'break';
  completed: boolean;
}

export interface Folder {
  id: string;
  name: string;
  appIds: string[];
  icon: string;
}

export interface UserSettings {
  userId: string;
  theme: 'monochrome-light' | 'monochrome-dark';
  mindfulDelayEnabled: boolean;
  showClock: boolean;
  showWorldClock: boolean;
  worldClocks: string[];
  focusDuration: number;
  breakDuration: number;
  systemAppLinks: {
    phone?: string;
    messages?: string;
    mail?: string;
    camera?: string;
    browser?: string;
  };
  appOrder: string[];
  blockedWebsites: string[];
  customIcons: Record<string, string>;
  customNames: Record<string, string>;
  folders: Folder[];
}

export const AVAILABLE_ICONS = [
  'CheckSquare', 'Timer', 'MessageSquare', 'Settings', 
  'Phone', 'MessageCircle', 'Camera', 'Globe', 
  'Clock', 'Lock', 'Shield', 'Layout', 'Layers', 
  'Zap', 'Target', 'Coffee', 'Book', 'Code',
  'Activity', 'Hash', 'Terminal', 'HardDrive'
];

export const ICON_MAP: Record<string, string> = {
  tasks: 'CheckSquare',
  focus: 'Timer',
  vox: 'MessageSquare',
  settings: 'Settings',
  phone: 'Phone',
  messages: 'MessageCircle',
  camera: 'Camera',
  browser: 'Globe',
  history: 'Clock',
  mail: 'Mail',
};

export const APPS = [
  { id: 'tasks', name: 'Tasks' },
  { id: 'focus', name: 'Focus' },
  { id: 'vox', name: 'Vox AI' },
  { id: 'settings', name: 'Settings' },
];

export const MOCKED_SYSTEM_APPS = [
  { id: 'phone', name: 'Phone' },
  { id: 'messages', name: 'Messages' },
  { id: 'mail', name: 'Mail' },
  { id: 'camera', name: 'Camera' },
  { id: 'browser', name: 'Browser' },
];
