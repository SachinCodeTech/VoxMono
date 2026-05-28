/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { 
  CheckSquare, 
  Timer, 
  MessageSquare, 
  Settings, 
  Phone, 
  MessageCircle, 
  Camera, 
  Globe,
  Plus,
  Trash2,
  Send,
  X,
  ChevronLeft,
  Moon,
  Sun,
  Lock,
  ArrowRight,
  Clock,
  ExternalLink,
  MoreVertical,
  Flag,
  Shield,
  ShieldCheck,
  Layout,
  Mail,
  Layers,
  Zap,
  Target,
  Coffee,
  Book,
  Code,
  Info,
  Cpu,
  Home,
  Activity,
  FileText,
  RotateCcw,
  User as UserIcon
} from 'lucide-react';
import { auth, db, signInWithGoogle, getLoginResult } from './lib/firebase.ts';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { Task, FocusSession, UserSettings, APPS, MOCKED_SYSTEM_APPS, ICON_MAP, AVAILABLE_ICONS, View, Folder } from './types.ts';
import { Reorder } from 'motion/react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Components ---

const SplashScreen = ({ onComplete, status }: { onComplete: () => void, status: string }) => {
  const bootSequence = [
    "Initializing Focus Protocols...",
    "Distraction Filter Enabled",
    "Deep Flow Engine Active",
    "Neural Path Calibrating...",
    "VOX SYSTEM ACTIVE"
  ];

  const [bootIndex, setBootIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBootIndex(prev => (prev < bootSequence.length - 1 ? prev + 1 : prev));
    }, 400); // Faster boot sequence
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if we should complete the splash
    if (bootIndex === bootSequence.length - 1 && status === 'ready') {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [bootIndex, status, onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 overflow-hidden"
    >
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-32 h-32 border border-white/20 rounded-full flex items-center justify-center mb-12 relative"
      >
        <div className="absolute inset-0 border border-white/40 rounded-full animate-ping opacity-20" />
        <h1 className="text-4xl font-thin tracking-tighter text-white">VOX</h1>
      </motion.div>

      <div className="space-y-3 text-center">
        <motion.p 
          key={bootIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[9px] uppercase tracking-[0.4em] text-white/40 font-bold"
        >
          {status === 'authenticating' ? 'Validating Quantum Identity...' : bootSequence[bootIndex]}
        </motion.p>
        <div className="w-48 h-[1px] bg-white/10 mx-auto overflow-hidden">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-1/3 h-full bg-white/40"
          />
        </div>
      </div>
    </motion.div>
  );
};

const NeuralLine = ({ theme }: { theme: string | undefined }) => (
  <div className="fixed top-0 inset-x-0 h-px overflow-hidden z-[100] opacity-20">
    <div className={`h-full w-40 neural-line ${theme === 'monochrome-dark' ? 'bg-white' : 'bg-black'}`} />
  </div>
);

const GlobalHeader = ({ theme, view, setView, isGuest, deviceFrame, isMobile }: { theme: string | undefined, view: View, setView: (v: View) => void, isGuest?: boolean, deviceFrame: string, isMobile: boolean }) => {
  const isDark = theme === 'monochrome-dark';
  const topPadding = (deviceFrame === 'raw' || isMobile) ? 'pt-10 pb-3' : 'pt-4 pb-2';
  const headerBg = isDark ? 'bg-[#0a0a0c]/85' : 'bg-[#fcfcfa]/85';

  return (
    <header className={`px-6 ${topPadding} flex items-center justify-between sticky top-0 z-30 transition-all ${headerBg} backdrop-blur-xl border-b border-transparent`}>
      <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('home')}>
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'bg-black shadow-[0_4px_12px_rgba(0,0,0,0.1)]'}`}
        >
          <div className={`w-3.5 h-3.5 ${isDark ? 'bg-black' : 'bg-white'} rotate-45`} />
        </motion.div>
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black uppercase tracking-[0.05em] leading-none">VoxMono</span>
            <span className="hidden sm:inline text-[9px] font-black uppercase tracking-[0.4em] opacity-40 leading-none">Sovereign OS</span>
          </div>
          <span className="sm:hidden text-[8px] font-black uppercase tracking-[0.4em] opacity-40 leading-none mt-1">Sovereign OS</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md transition-all duration-500
            ${isGuest ? (isDark ? 'bg-white/10 border-white/20' : 'bg-slate-100 border-slate-200/80 text-slate-800') : (isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200/80 text-slate-800')}`}>
            <Activity size={10} className={isGuest ? "text-yellow-500 animate-pulse" : "text-green-500 animate-pulse"} />
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
              {isGuest ? 'GUEST_SYMMETRY' : 'STABLE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

const AuthScreen = ({ onGuestLogin }: { onGuestLogin: () => void }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<{ title: string, details: string[], code?: string } | null>(null);

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      setError({
        title: "UNABLE TO CONNECT TO AUTH SYSTEM",
        code: err.code,
        details: [
          err.message || "Redirect authentication protocol failed",
          "Browser restrictions in standalone mode",
          "Authorized Domain not set for this project"
        ]
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const currentDomain = window.location.hostname;
  const firebaseSettingsLink = `https://console.firebase.google.com/u/0/project/linen-radius-9cf5x/authentication/settings`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 mb-20 text-center"
      >
        <h1 className="text-7xl font-thin tracking-tighter">VOX</h1>
        <p className="text-[10px] uppercase tracking-[0.4em] text-black/40 font-black">Monochrome Productivity OS</p>
      </motion.div>
      
      <div className="flex flex-col items-center gap-6 w-full max-w-xs">
        <button 
          onClick={handleSignIn}
          disabled={isSigningIn}
          className={`w-full border-2 border-black px-6 py-5 text-sm font-black uppercase tracking-[0.3em] transition-all duration-500 overflow-hidden relative group rounded-2xl ${isSigningIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black hover:text-white active:scale-95'}`}
        >
          <span className="relative z-10">{isSigningIn ? 'NEGOTIATING...' : 'SECURE INITIALIZE'}</span>
        </button>

        <button 
          onClick={onGuestLogin}
          className="text-[10px] uppercase tracking-[0.3em] font-black opacity-30 hover:opacity-100 transition-opacity p-4"
        >
          - CONTINUE AS GUEST -
        </button>

        {error && (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-700 bg-red-50 p-6 rounded-[2rem] border border-red-100">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold">{error.title}</p>
              {error.code && <p className="text-[8px] font-mono opacity-40 uppercase">System Exception: {error.code}</p>}
            </div>

            <div className="space-y-3">
              {error.details.map((detail, idx) => (
                <p key={idx} className="text-[9px] uppercase tracking-widest leading-relaxed opacity-60">• {detail}</p>
              ))}
            </div>

            <div className="pt-4 border-t border-red-200/50 mt-4 space-y-4">
              <div className="space-y-2">
                <p className="text-[8px] uppercase tracking-widest font-black text-red-500">VOX AUTHORIZATION LINK:</p>
                <a 
                  href={firebaseSettingsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl bg-red-100 text-red-600 font-mono text-[9px] underline decoration-red-200 hover:bg-red-200/50 transition-colors break-all"
                >
                  OPEN FIREBASE SETTINGS
                </a>
              </div>
              
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-widest font-black text-black/40">DOMAIN TO AUTHORIZE:</p>
                <div className="bg-white/80 p-2 rounded-lg border border-red-100 select-all font-mono text-[9px] break-all">
                  {currentDomain}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AppIcon = ({ id, name, onClick, onEdit, isSystem = false, settings }: { id: string, name: string, onClick: () => void, onEdit?: () => void, isSystem?: boolean, settings?: UserSettings | null, key?: string | number }) => {
  const customName = settings?.customNames?.[id] || name;
  const iconName = settings?.customIcons?.[id] || ICON_MAP[id] || 'Globe';
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Globe;
  const isDark = settings?.theme === 'monochrome-dark';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-2 group w-full relative min-h-[105px] h-[110px]"
    >
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        className={`w-14 h-14 border rounded-2xl flex items-center justify-center transition-all duration-300 relative
          ${isDark 
            ? 'glass-dark border-white/10 text-white shadow-lg' 
            : 'bg-white border-neutral-200/80 text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-slate-400'} 
          ${isSystem ? 'border-dashed' : ''}`}
      >
        <IconComponent size={21} strokeWidth={1.5} className="transition-all duration-300" />
      </motion.button>

      {onEdit && (
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white dark:bg-white dark:text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
        >
          <Settings size={9} />
        </button>
      )}

      <div className="w-full min-h-[32px] flex items-start justify-center pt-1.5">
        <span className={`text-[9px] uppercase tracking-[0.05em] transition-all duration-300 w-full text-center px-0.5 leading-tight break-words line-clamp-2
          ${isDark ? 'text-white/60 font-medium group-hover:text-white' : 'text-slate-800/90 font-bold group-hover:text-black'}`}>
          {customName}
        </span>
      </div>
    </motion.div>
  );
};

const STOIC_QUOTES = [
  { text: "He who is everywhere is nowhere.", author: "Seneca" },
  { text: "The soul becomes dyed with the color of its thoughts.", author: "Marcus Aurelius" },
  { text: "Silence is a lesson in all things.", author: "Pliny the Younger" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "If a man knows not to which port he sails, no wind is favorable.", author: "Seneca" },
  { text: "Limit yourself to the present.", author: "Marcus Aurelius" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "Quiet minds cannot be perplexed or frightened.", author: "Seneca" },
  { text: "The best revenge is to be unlike him who performed the injury.", author: "Marcus Aurelius" },
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca" },
];

const getDayOfYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [bootStatus, setBootStatus] = useState<'booting' | 'authenticating' | 'ready'>('booting');
  const [currentView, setCurrentView] = useState<View>('home');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Work' | 'Social' | 'Essential'>('All');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [showDelay, setShowDelay] = useState(false);
  const [reorderedApps, setReorderedApps] = useState<string[]>([]);
  const [notificationPreview, setNotificationPreview] = useState<{ title: string, body: string, app: string } | null>(null);
  const [deviceFrame, setDeviceFrame] = useState<'ios' | 'android' | 'raw'>(() => {
    const stored = localStorage.getItem('vox_device_frame') as 'ios' | 'android' | 'raw';
    if (stored && ['ios', 'android', 'raw'].includes(stored)) return stored;
    return 'ios';
  });
  const [isMobile, setIsMobile] = useState(false);

  const handleDeviceFrameChange = (frame: 'ios' | 'android' | 'raw') => {
    setDeviceFrame(frame);
    localStorage.setItem('vox_device_frame', frame);
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobileVal = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobileVal);
      if (mobileVal) {
        setDeviceFrame('raw');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Check if guest mode was enabled previously
    const savedGuestMode = localStorage.getItem('vox_guest_mode');
    if (savedGuestMode === 'true') {
      setIsGuest(true);
      const savedSettings = localStorage.getItem('vox_guest_settings');
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.error("Failed parsing guest settings", e);
        }
      } else {
        setSettings({
          userId: 'guest',
          theme: 'monochrome-light',
          mindfulDelayEnabled: true,
          showClock: true,
          showWorldClock: true,
          worldClocks: ['Asia/Kolkata'],
          customNames: {},
          customIcons: {},
          folders: [],
          appOrder: APPS.map(a => a.id)
        });
      }
    }

    // Initial Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setIsGuest(false);
        localStorage.removeItem('vox_guest_mode');
      }
      setLoading(false);
      setBootStatus('ready');
    });

    // Check for redirect result in background
    const checkRedirect = async () => {
      setBootStatus('authenticating');
      try {
        await getLoginResult();
      } catch (err) {
        console.error("Redirect auth error:", err);
      } finally {
        setBootStatus('ready');
      }
    };

    checkRedirect();
    return () => unsubscribe();
  }, []);

  const handleGuestLogin = () => {
    setIsGuest(true);
    localStorage.setItem('vox_guest_mode', 'true');
    setLoading(false);
    setShowSplash(false);
    
    const savedSettings = localStorage.getItem('vox_guest_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error(e);
      }
    } else {
      setSettings({
        userId: 'guest',
        theme: 'monochrome-light',
        mindfulDelayEnabled: true,
        showClock: true,
        showWorldClock: true,
        worldClocks: ['Asia/Kolkata'],
        focusDuration: 25,
        breakDuration: 5,
        systemAppLinks: {
          browser: 'https://google.com'
        },
        customNames: {},
        customIcons: {},
        folders: [],
        blockedWebsites: [],
        appOrder: APPS.map(a => a.id)
      });
    }
  };

  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  useEffect(() => {
    if (!user) return;
    const settingsDoc = doc(db, 'users', user.uid, 'settings', 'global');
    const unsubscribeSettings = onSnapshot(settingsDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserSettings;
        setSettings(data);
        setReorderedApps(data.appOrder || [
          ...APPS.map(a => a.id),
          ...(data.folders?.map(f => f.id) || [])
        ]);
      } else {
        setDoc(settingsDoc, {
          userId: user.uid,
          theme: 'monochrome-light',
          mindfulDelayEnabled: true,
          showClock: true,
          showWorldClock: false,
          worldClocks: ['Europe/London', 'America/New_York', 'Asia/Tokyo'],
          focusDuration: 25,
          breakDuration: 5,
          systemAppLinks: {
            browser: 'https://google.com'
          },
          appOrder: APPS.map(a => a.id),
          blockedWebsites: [],
          customIcons: {},
          customNames: {},
          folders: []
        });
      }
    });

    return () => unsubscribeSettings();
  }, [user]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (isGuest) {
      const newSettings = { ...settings, ...updates } as UserSettings;
      setSettings(newSettings);
      localStorage.setItem('vox_guest_settings', JSON.stringify(newSettings));
      return;
    }
    if (!user) return;
    const settingsDoc = doc(db, 'users', user.uid, 'settings', 'global');
    await updateDoc(settingsDoc, updates);
  };

  const handleSignOut = () => {
    if (isGuest) {
      setIsGuest(false);
      localStorage.removeItem('vox_guest_mode');
      localStorage.removeItem('vox_guest_settings');
      setSettings(null);
      setCurrentView('home');
      return;
    }
    auth.signOut();
  };

  const createFolder = async (appIds: string[]) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: 'New Folder',
      appIds,
      icon: 'Layout'
    };
    const updatedFolders = [...(settings?.folders || []), newFolder];
    await updateSettings({ folders: updatedFolders, appOrder: [...reorderedApps.filter(id => !appIds.includes(id)), newFolder.id] });
  };

  const handleAppEdit = (id: string) => {
    setEditingApp(id);
  };

  const handleQuickAction = (appId: string) => {
    if (appId === 'tasks') handleAppClick('tasks');
    if (appId === 'focus') handleAppClick('focus');
  };

  const handleAppClick = (view: any) => {
    if (settings?.mindfulDelayEnabled && view !== 'home') {
      setShowDelay(true);
      setTimeout(() => {
        setShowDelay(false);
        setCurrentView(view);
      }, 1200); // Reduced delay for better UX while keeping intent
    } else {
      setCurrentView(view);
    }
  };

  const handleReorder = async (newOrder: string[]) => {
    setReorderedApps(newOrder);
    if (isGuest) {
      await updateSettings({ appOrder: newOrder });
      return;
    }
    if (!user) return;
    const settingsDoc = doc(db, 'users', user.uid, 'settings', 'global');
    await updateDoc(settingsDoc, { appOrder: newOrder });
  };

  const handleSystemAppClick = (id: string) => {
    const link = settings?.systemAppLinks?.[id as keyof typeof settings.systemAppLinks];
    if (link) {
      window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
    } else {
      const defaultLinks: any = { 
        phone: 'tel:', 
        browser: 'https://google.com',
        mail: 'mailto:',
        messages: 'sms:'
      };
      if (defaultLinks[id]) {
        window.open(defaultLinks[id], '_blank');
      } else {
        setNotificationPreview({
          title: `Mission Diverted: ${id}`,
          body: `Digital filter active. This system component requires a destination protocol. Define it in settings.`,
          app: id
        });
      }
    }
  };

  const proceedToApp = () => {
    if (!notificationPreview) return;
    const id = notificationPreview.app;
    setNotificationPreview(null);
    
    const link = settings?.systemAppLinks?.[id as keyof typeof settings.systemAppLinks];
    if (link) {
      window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
      return;
    }

    const defaultLinks: any = { 
      phone: 'tel:', 
      browser: 'https://google.com',
      mail: 'mailto:',
      messages: 'sms:'
    };
    if (defaultLinks[id]) window.open(defaultLinks[id], '_blank');
  };

  // If user is not logged in and splash is done, show auth
  if (!user && !isGuest && !loading && !showSplash) {
    return <AuthScreen onGuestLogin={handleGuestLogin} />;
  }

  if (loading && !showSplash) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-[10px] uppercase tracking-[0.4em] opacity-40 font-black">Syncing Protocol...</p>
      </div>
    );
  }

  const appMap = [...APPS, ...MOCKED_SYSTEM_APPS].reduce((acc, app) => ({ ...acc, [app.id]: app }), {} as any);

  const BottomNav = () => (
    <div className={`${deviceFrame === 'raw' ? 'fixed' : 'absolute'} bottom-0 inset-x-0 z-40 border-t ${settings?.theme === 'monochrome-dark' ? 'bg-[#0a0a0c]/95 border-white/10 text-white' : 'bg-white/95 border-slate-200/80 text-slate-900 shadow-[0_-8px_32px_rgba(0,0,0,0.03)]'} backdrop-blur-xl px-4 ${deviceFrame === 'raw' ? 'pb-8 pt-4' : 'pb-4 pt-2'} transition-all duration-300`}>
      <div className="flex justify-between items-center max-w-sm mx-auto relative px-2">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'focus', icon: Timer, label: 'Focus' },
          { id: 'tasks', icon: CheckSquare, label: 'Mission' },
          { id: 'history', icon: Clock, label: 'Memory' },
          { id: 'settings', icon: Settings, label: 'System' },
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => {
              setCurrentView(item.id as any);
            }}
            className={`flex flex-col items-center gap-1 transition-all relative ${currentView === item.id ? 'opacity-100 scale-102 font-bold' : 'opacity-65 hover:opacity-100 font-medium'}`}
          >
            <div className="p-1 transition-all duration-500 relative">
              <item.icon size={20} strokeWidth={currentView === item.id ? 2.5 : 1.5} className={`relative z-10 ${currentView === item.id ? (settings?.theme === 'monochrome-dark' ? 'text-white' : 'text-slate-950') : (settings?.theme === 'monochrome-dark' ? 'text-white/60' : 'text-slate-500')}`} />
              {currentView === item.id && (
                <motion.div 
                  layoutId="activeIndicator"
                  className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-7 h-0.5 rounded-full ${settings?.theme === 'monochrome-dark' ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]' : 'bg-slate-950 shadow-[0_0_12px_rgba(0,0,0,0.3)]'}`} 
                />
              )}
            </div>
            <span className={`text-[8px] uppercase tracking-[0.2em] font-black transition-all ${currentView === item.id ? 'opacity-100' : 'opacity-65 font-bold'}`}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );  const renderWorkspace = (content: React.ReactNode) => {
    if (showSplash) {
      return content;
    }

    const themeBg = settings?.theme === 'monochrome-dark' 
      ? 'bg-[#0a0a0c] text-white' 
      : 'bg-white text-black';
    const isDark = settings?.theme === 'monochrome-dark';

    if (deviceFrame === 'raw' || isMobile) {
      return (
        <motion.div 
          className={`w-full min-h-screen flex flex-col relative ${themeBg}`}
          onWheel={(e) => {
            if (e.deltaY > 50 && currentView === 'home') setCurrentView('vox');
            if (e.deltaY < -50 && currentView === 'vox') setCurrentView('home');
          }}
          onPanEnd={(_, info) => {
            if (info.offset.y < -100 && currentView === 'home') setCurrentView('vox');
            if (info.offset.y > 100 && currentView === 'vox') setCurrentView('home');
            
            if (info.offset.x < -100 && currentView === 'home') setCurrentView('tasks');
            if (info.offset.x > 100 && currentView === 'tasks') setCurrentView('home');
          }}
        >
          {content}
        </motion.div>
      );
    }

    if (deviceFrame === 'ios') {
      return (
        <div className="w-full min-h-screen pt-16 pb-12 flex items-center justify-center bg-[#07080d] relative overflow-y-auto selection:bg-white selection:text-black transition-all duration-500">
          {/* Ambient desk glow */}
          <div className="absolute inset-0 bg-radial-at-t from-[#1b1e32] via-[#07080d] to-[#010103] opacity-95 -z-10" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 -z-10" />
          
          {/* iPhone 15 Pro Hardware Frame */}
          <div className="relative w-[385px] h-[812px] rounded-[3.2rem] border-[10px] border-[#1d1e22] bg-[#0a0a0c] shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden ring-1 ring-white/10">
            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6.5 bg-black rounded-full z-50 border border-white/5 shadow-inner flex items-center justify-between px-3 select-none hover:scale-x-105 transition-all duration-300">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0d0d18]" />
              <span className="text-[7.5px] uppercase font-black tracking-[0.2em] text-emerald-400 animate-pulse">flow on</span>
              <div className="w-1.5 h-1.5 rounded-full border border-gray-950 bg-emerald-500" />
            </div>

            {/* iOS Status Bar */}
            <div className={`h-10 px-6 pt-3 flex justify-between items-center bg-transparent z-45 text-[9.5px] font-black select-none ${isDark ? 'text-white' : 'text-black'}`}>
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
              <div className="flex items-center gap-1.5 opacity-90">
                <LucideIcons.Signal size={10} />
                <span className="text-[7.5px] uppercase font-black">LTE</span>
                <LucideIcons.Wifi size={10} />
                <LucideIcons.Battery size={13} className="opacity-80" />
              </div>
            </div>

            {/* Viewport content */}
            <div className={`flex-1 overflow-y-auto scrollbar-hide relative pb-20 ${themeBg}`}>
              {content}
            </div>

            {/* Bottom Gesture Line */}
            <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full z-40 pointer-events-none ${isDark ? 'bg-white/40' : 'bg-black/40'}`} />
          </div>
        </div>
      );
    }

    if (deviceFrame === 'android') {
      return (
        <div className="w-full min-h-screen pt-16 pb-12 flex items-center justify-center bg-[#05060a] relative overflow-y-auto selection:bg-white selection:text-black transition-all duration-500">
          {/* Ambient desk glow */}
          <div className="absolute inset-0 bg-radial-at-t from-[#201530] via-[#05060a] to-[#010103] opacity-95 -z-10" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] opacity-35 -z-10" />

          {/* Android Pixel Hardware Frame */}
          <div className="relative w-[385px] h-[812px] rounded-[2.8rem] border-[11px] border-[#222328] bg-[#0a0a0c] shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden ring-1 ring-white/10">
            {/* Selfie camera punchhole */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0a0a0c] border border-white/5 rounded-full z-50 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1c1c38]" />
            </div>

            {/* Android Status Bar */}
            <div className={`h-10 px-6 pt-2 flex justify-between items-center bg-transparent z-45 text-[9.5px] font-black select-none ${isDark ? 'text-white' : 'text-black'}`}>
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
              <div className="flex items-center gap-1.5 opacity-90">
                <span className="text-[7.5px] uppercase font-black">5G</span>
                <div className="flex items-center gap-0.5">
                  <div className={`w-1 h-1.5 rounded-2xs ${isDark ? 'bg-white' : 'bg-black'}`} />
                  <div className={`w-1 h-2 rounded-2xs ${isDark ? 'bg-white' : 'bg-black'}`} />
                  <div className={`w-1 h-2.5 rounded-2xs ${isDark ? 'bg-white' : 'bg-black'}`} />
                  <div className={`w-1 h-3 rounded-2xs opacity-40 ${isDark ? 'bg-white' : 'bg-black'}`} />
                </div>
                <LucideIcons.BatteryMedium size={12} className="opacity-80" />
              </div>
            </div>

            {/* Viewport content */}
            <div className={`flex-1 overflow-y-auto scrollbar-hide relative pb-20 ${themeBg}`}>
              {content}
            </div>

            {/* Bottom Gesture Line */}
            <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full z-40 pointer-events-none ${isDark ? 'bg-white/30' : 'bg-black/30'}`} />
          </div>
        </div>
      );
    }

    return content;
  };

  const isDark = settings?.theme === 'monochrome-dark';
  const rootBg = (isMobile || deviceFrame === 'raw') 
    ? (isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black')
    : 'bg-[#07080d] text-white';

  return (
    <div className={`min-h-screen ${rootBg} font-sans transition-colors duration-500 overflow-hidden relative selection:bg-black selection:text-white`}>
      
      <AnimatePresence>
        {showSplash && <SplashScreen status={bootStatus} onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <NeuralLine theme={settings?.theme} />

      {/* Mindful Delay Overlay */}
      <AnimatePresence>
        {showDelay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-inherit backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center space-y-4"
            >
              <p className="text-xs uppercase tracking-[0.3em] opacity-40">Pause. Be Present.</p>
              <div className="w-12 h-px bg-current opacity-20 mx-auto" />
              <motion.div 
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 1.2, ease: "linear" }}
                className="h-0.5 bg-current opacity-60"
                style={{ width: "80px", margin: "auto" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Filter Preview */}
      <AnimatePresence>
        {notificationPreview && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 inset-x-0 z-50 px-6"
          >
            <div className={`p-5 rounded-3xl border ${settings?.theme === 'monochrome-dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-gray-50 border-black/5'} shadow-2xl backdrop-blur-xl`}>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-black rounded-xl">
                  <Lock size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest">{notificationPreview.title}</h3>
                  <p className="text-[11px] opacity-60 mt-1 leading-relaxed">{notificationPreview.body}</p>
                  <div className="flex gap-4 mt-4">
                    <button 
                      onClick={proceedToApp}
                      className="text-[10px] font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4"
                    >
                      Initialize
                    </button>
                    <button 
                      onClick={() => setNotificationPreview(null)}
                      className="text-[10px] font-bold uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingApp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setEditingApp(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl ${settings?.theme === 'monochrome-dark' ? 'bg-[#111] border border-white/10' : 'bg-white border border-black/10'}`}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40 mb-8">Edit Identity</h3>
              
              <div className="space-y-8">
                <div>
                  <label className="text-[8px] uppercase tracking-widest font-black opacity-30 mb-2 block">Rename</label>
                  <input 
                    type="text" 
                    placeholder="Application Name"
                    defaultValue={settings?.customNames?.[editingApp] || appMap[editingApp]?.name || editingApp}
                    onChange={(e) => {
                      const newNames = { ...(settings?.customNames || {}), [editingApp]: e.target.value };
                      updateSettings({ customNames: newNames });
                    }}
                    className="w-full bg-transparent border-b border-white/10 dark:border-white/10 py-2 outline-none text-sm tracking-widest uppercase"
                  />
                </div>

                <div>
                  <label className="text-[8px] uppercase tracking-widest font-black opacity-30 mb-4 block">Symbol</label>
                  <div className="grid grid-cols-5 gap-3">
                    {AVAILABLE_ICONS.slice(0, 15).map(icon => {
                      const Icon = (LucideIcons as any)[icon];
                      return (
                        <button 
                          key={icon}
                          onClick={() => {
                            const newIcons = { ...(settings?.customIcons || {}), [editingApp]: icon };
                            updateSettings({ customIcons: newIcons });
                          }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${settings?.customIcons?.[editingApp] === icon ? 'bg-white text-black dark:bg-white dark:text-black scale-110 shadow-lg' : 'bg-gray-100 dark:bg-white/5 opacity-40'}`}
                        >
                          <Icon size={14} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                   <button 
                    onClick={() => handleQuickAction(editingApp)}
                    className="w-full py-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-[10px] uppercase font-black tracking-widest shadow-xl"
                  >
                    Quick Launch
                  </button>
                  <button 
                    onClick={() => setEditingApp(null)}
                    className="w-full py-4 rounded-2xl border border-black/10 dark:border-white/10 text-[10px] uppercase font-black tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedFolder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 backdrop-blur-xl"
            onClick={() => setSelectedFolder(null)}
          >
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="w-full max-w-lg"
               onClick={e => e.stopPropagation()}
            >
              <div className="mb-20">
                <input 
                  value={selectedFolder.name}
                  onChange={(e) => {
                    const updated = settings?.folders?.map(f => f.id === selectedFolder.id ? { ...f, name: e.target.value } : f) || [];
                    setSelectedFolder({ ...selectedFolder, name: e.target.value });
                    updateSettings({ folders: updated });
                  }}
                  className="bg-transparent text-center text-3xl md:text-5xl font-thin tracking-tight uppercase outline-none w-full text-white placeholder:opacity-20 py-2 border-b border-white/10"
                  placeholder="ID_NULL"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-4 gap-4 px-4">
                {selectedFolder.appIds.map(id => (
                  <AppIcon 
                    key={id}
                    id={id}
                    name={appMap[id]?.name || id}
                    onClick={() => {
                      setSelectedFolder(null);
                      handleAppClick(id as any);
                    }}
                    settings={settings}
                  />
                ))}
              </div>
              <button 
                onClick={() => setSelectedFolder(null)}
                className="mt-20 w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/40 hover:text-white transition-all mx-auto"
              >
                <ArrowRight size={20} className="rotate-180" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Universal Workspace Control Panel Chassis Switcher */}
      {!showSplash && (user || isGuest) && !isMobile && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-3.5 py-1.5 bg-black/90 border border-white/10 text-white rounded-full flex items-center gap-2 shadow-2xl backdrop-blur-xl transition-all hover:scale-[1.01] hover:bg-black">
          <div className="flex items-center gap-1 opacity-70 border-r border-white/10 pr-2 select-none">
            <LucideIcons.Globe size={11} className="text-blue-500 animate-pulse" />
            <span className="text-[7.5px] tracking-[0.25em] font-black uppercase">Chassis:</span>
          </div>
          <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-full">
            {[
              { id: 'ios' as const, label: 'iOS', icon: LucideIcons.Smartphone },
              { id: 'android' as const, label: 'Android', icon: LucideIcons.Tv },
              { id: 'raw' as const, label: 'Raw OS', icon: LucideIcons.Maximize2 }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => handleDeviceFrameChange(f.id)}
                className={`px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider font-extrabold transition-all duration-350 flex items-center gap-1
                  ${deviceFrame === f.id 
                    ? 'bg-white text-black shadow-md scale-105 font-black' 
                    : 'opacity-55 hover:opacity-100 text-white hover:bg-white/10'}`}
              >
                <f.icon size={9} />
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {renderWorkspace(
        <>
          {/* Global Header */}
          {!showSplash && (user || isGuest) && (
            <GlobalHeader theme={settings?.theme} view={currentView} setView={setCurrentView} isGuest={isGuest} deviceFrame={deviceFrame} isMobile={isMobile} />
          )}

          <AnimatePresence mode="wait">
          {(user || isGuest) && currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="flex-1 px-5 py-3 flex flex-col pb-24"
            >
              {/* Launcher Search */}
              <div className="mb-5 relative">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-[1.25rem] border ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200/80 text-slate-800'} transition-all focus-within:border-black/20 dark:focus-within:border-white/30 shadow-sm`}>
                  <Globe size={16} className="opacity-40" />
                  <input 
                    type="text" 
                    placeholder="Search System or Web..." 
                    className="bg-transparent border-none outline-none text-xs w-full uppercase tracking-widest placeholder:opacity-40 font-medium"
                  />
                </div>
              </div>

              {/* Time & Productivity Widget */}
              {settings?.showClock && (
                <div className="mb-5 flex flex-col items-center">
                  <p className="text-[9px] uppercase tracking-[0.35em] font-extrabold text-neutral-500 dark:text-neutral-400 mb-1">
                    {isGuest ? 'Guest Protocol Active' : 'Good Day, Explorer'}
                  </p>
                  <div className="relative group">
                    <motion.h2 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-6xl sm:text-7xl font-extralight tracking-[-0.05em] transition-all duration-700 group-hover:tracking-normal leading-none"
                    >
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                    </motion.h2>
                    <div className="absolute -right-10 bottom-1.5 text-xl font-light tracking-tighter opacity-30">
                      {new Date().getHours() >= 12 ? 'PM' : 'AM'}
                    </div>
                  </div>

                  {settings?.showWorldClock && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-5 mt-2.5 text-neutral-500 dark:text-neutral-400 select-none font-medium"
                    >
                      {(settings.worldClocks || [
                        'Europe/London', 
                        'America/New_York', 
                        'Asia/Tokyo'
                      ]).map(tz => {
                        try {
                          return (
                            <div key={tz} className="flex flex-col items-center">
                              <span className="text-[7px] font-bold uppercase tracking-widest mb-0.5">
                                {tz.split('/').pop()?.replace('_', ' ').substring(0, 3)}
                              </span>
                              <span className="text-[9px] font-mono tracking-tighter">
                                {new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        } catch (e) {
                          return null;
                        }
                      })}
                    </motion.div>
                  )}

                  {/* Daily Focus Quote / Stoic Reflection */}
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 mb-2 px-5 py-3.5 rounded-3xl border text-center max-w-[310px] shadow-[0_4px_16px_rgba(0,0,0,0.01)] relative group overflow-hidden
                      ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50/80 border-slate-200/60'}`}
                  >
                    <p className={`text-[11px] leading-relaxed font-serif font-medium
                      ${settings?.theme === 'monochrome-dark' ? 'text-white/80' : 'text-slate-800'}`}>
                      "{STOIC_QUOTES[getDayOfYear() % STOIC_QUOTES.length].text}"
                    </p>
                    <p className="text-[8px] uppercase tracking-widest text-slate-500 dark:text-white/40 font-bold mt-2 font-mono">
                      — {STOIC_QUOTES[getDayOfYear() % STOIC_QUOTES.length].author}
                    </p>
                  </motion.div>
                  
                  <div className="flex items-center gap-5 mt-4 text-neutral-500 dark:text-neutral-400">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-white/40 mb-0.5">Goal</span>
                      <span className="text-[11px] font-mono font-semibold text-slate-800 dark:text-white">4H 00M</span>
                    </div>
                    <div className="w-px h-5 bg-current opacity-15" />
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-white/40 mb-0.5">Score</span>
                      <div className="flex items-center gap-1">
                        <Activity size={9} className="text-green-500" />
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-white">9.2</span>
                      </div>
                    </div>
                    <div className="w-px h-5 bg-current opacity-15" />
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-white/40 mb-0.5">Focus</span>
                      <span className="text-[11px] font-mono font-semibold text-slate-800 dark:text-white">2H 45M</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Intelligence Strip */}
              <div className="mb-5">
                 <div className={`p-4 px-5 rounded-[1.75rem] flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.015)] transition-all relative overflow-hidden
                  ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-200/80 shadow-sm'}`}>
                   <div className="flex items-center gap-4 relative z-10">
                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${settings?.theme === 'monochrome-dark' ? 'bg-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
                       <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                       >
                         <Target size={18} strokeWidth={2} className="text-green-500" />
                       </motion.div>
                     </div>
                     <div>
                       <div className="flex items-center gap-2 mb-0.5">
                         <span className="text-[9px] uppercase tracking-[0.25em] font-extrabold text-slate-500 dark:text-white/40">Neural Update</span>
                         <span className="w-1 h-1 rounded-full bg-green-500" />
                       </div>
                       <p className="text-[11px] font-bold tracking-tight leading-tight text-neutral-800 dark:text-white">12% more efficient today than average.</p>
                     </div>
                   </div>
                   <motion.div 
                    whileHover={{ x: 2 }}
                    className="relative z-10 p-1"
                   >
                    <ArrowRight size={14} className="opacity-40" />
                   </motion.div>
                   
                   {/* Background pulse */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-500/5 blur-[40px] rounded-full pointer-events-none" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className={`p-4 rounded-[1.75rem] border ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/5 shadow-lg' : 'bg-slate-50 border-slate-200/85 shadow-[0_3px_10px_rgba(0,0,0,0.01)]'}`}>
                  <p className="text-[8px] uppercase tracking-[0.4em] font-extrabold text-slate-500 dark:text-white/40 mb-2">Core Session</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-light tracking-tight">14</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 trailing-widest">Days</span>
                  </div>
                </div>
                <div className={`p-4 rounded-[1.75rem] border ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/5 shadow-lg' : 'bg-slate-50 border-slate-200/85 shadow-[0_3px_10px_rgba(0,0,0,0.01)]'}`}>
                  <p className="text-[8px] uppercase tracking-[0.4em] font-extrabold text-slate-500 dark:text-white/40 mb-2">Neural Load</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-light tracking-tight">1.8</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 trailing-widest">Hrs</span>
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex gap-1.5 mb-5 justify-center overflow-x-auto pb-1 scrollbar-hide">
                {(['All', 'Work', 'Social', 'Essential'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-[9px] uppercase tracking-widest font-black border transition-all duration-300 cursor-pointer
                      ${activeCategory === cat 
                        ? (settings?.theme === 'monochrome-dark' ? 'bg-white text-black border-white shadow-lg' : 'bg-slate-900 text-white border-slate-900 shadow-sm')
                        : (settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-black hover:bg-slate-100')
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Main Apps - Draggable */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {activeCategory === 'All' ? (
                  <Reorder.Group axis="y" values={reorderedApps} onReorder={handleReorder} className="flex-1">
                    <div className="grid grid-cols-4 gap-y-5 gap-x-1.5">
                      {reorderedApps.map(id => {
                        const folder = settings?.folders?.find(f => f.id === id);
                        if (folder) {
                          return (
                            <Reorder.Item key={id} value={id}>
                              <motion.div
                                onClick={() => setSelectedFolder(folder)}
                                className="flex flex-col items-center gap-2 group w-full relative min-h-[105px] h-[110px] cursor-pointer"
                              >
                                 <div className={`w-14 h-14 border rounded-2xl p-2.5 grid grid-cols-2 gap-1 transition-all duration-500 overflow-hidden
                                  ${settings?.theme === 'monochrome-dark' ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)]'}`}>
                                  {folder.appIds.slice(0, 4).map(appId => {
                                    const Icon = (LucideIcons as any)[settings?.customIcons?.[appId] || ICON_MAP[appId] || 'Globe'];
                                    return <Icon key={appId} size={9} className="opacity-50 text-slate-700 dark:text-white" />;
                                  })}
                                </div>
                                <div className="w-full min-h-[32px] flex items-start justify-center pt-1.5">
                                  <span className={`text-[9px] uppercase tracking-[0.05em] w-full text-center px-0.5 leading-tight break-words line-clamp-2
                                    ${settings?.theme === 'monochrome-dark' ? 'text-white/60 font-medium group-hover:text-white' : 'text-slate-800/90 font-bold group-hover:text-black'}`}>
                                    {folder.name}
                                  </span>
                                </div>
                              </motion.div>
                            </Reorder.Item>
                          );
                        }
                        return (
                          <Reorder.Item key={id} value={id}>
                            <AppIcon 
                              id={id} 
                              name={appMap[id]?.name || id} 
                              onClick={() => handleAppClick(id as any)} 
                              onEdit={() => handleAppEdit(id)}
                              settings={settings}
                            />
                          </Reorder.Item>
                        );
                      })}
                    </div>
                  </Reorder.Group>
                ) : (
                  <div className="grid grid-cols-4 gap-y-5 gap-x-1.5 animate-fadeIn">
                    {reorderedApps
                      .filter(id => {
                        const folder = settings?.folders?.find(f => f.id === id);
                        if (folder) {
                          const appCategories: Record<string, string> = {
                            tasks: 'Work', focus: 'Work', vox: 'Essential', settings: 'Essential',
                            phone: 'Essential', messages: 'Social', mail: 'Work', camera: 'Social', browser: 'Work'
                          };
                          return folder.appIds.some(appId => appCategories[appId] === activeCategory);
                        }
                        const appCategories: Record<string, string> = {
                          tasks: 'Work', focus: 'Work', vox: 'Essential', settings: 'Essential',
                          phone: 'Essential', messages: 'Social', mail: 'Work', camera: 'Social', browser: 'Work'
                        };
                        return appCategories[id] === activeCategory;
                      })
                      .map(id => {
                        const folder = settings?.folders?.find(f => f.id === id);
                        if (folder) {
                          return (
                            <motion.div
                              key={id}
                              onClick={() => setSelectedFolder(folder)}
                              className="flex flex-col items-center gap-2 group w-full relative min-h-[105px] h-[110px] cursor-pointer"
                            >
                               <div className={`w-14 h-14 border rounded-2xl p-2.5 grid grid-cols-2 gap-1 transition-all duration-500 overflow-hidden
                                ${settings?.theme === 'monochrome-dark' ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)]'}`}>
                                {folder.appIds.slice(0, 4).map(appId => {
                                  const Icon = (LucideIcons as any)[settings?.customIcons?.[appId] || ICON_MAP[appId] || 'Globe'];
                                  return <Icon key={appId} size={9} className="opacity-50 text-slate-700 dark:text-white" />;
                                })}
                              </div>
                              <div className="w-full min-h-[32px] flex items-start justify-center pt-1.5">
                                <span className={`text-[9px] uppercase tracking-[0.05em] w-full text-center px-0.5 leading-tight break-words line-clamp-2
                                  ${settings?.theme === 'monochrome-dark' ? 'text-white/60 font-medium group-hover:text-white' : 'text-slate-800/90 font-bold group-hover:text-black'}`}>
                                  {folder.name}
                                </span>
                              </div>
                            </motion.div>
                          );
                        }
                        return (
                          <AppIcon 
                            key={id}
                            id={id} 
                            name={appMap[id]?.name || id} 
                            onClick={() => handleAppClick(id as any)} 
                            onEdit={() => handleAppEdit(id)}
                            settings={settings}
                          />
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Bottom Fixed Dock */}
              <div className={`mt-5 pt-4 border-t ${settings?.theme === 'monochrome-dark' ? 'border-white/5' : 'border-slate-200/80'} flex justify-between items-center px-2`}>
                {[
                  { id: 'phone', label: 'Call', icon: LucideIcons.Phone },
                  { id: 'messages', label: 'Comm', icon: LucideIcons.MessageSquare },
                  { id: 'camera', label: 'Lens', icon: LucideIcons.Camera },
                  { id: 'browser', label: 'Web', icon: LucideIcons.Globe },
                ].map(dockApp => (
                  <button 
                    key={dockApp.id}
                    onClick={() => handleSystemAppClick(dockApp.id)}
                    className="flex flex-col items-center gap-1.5 group px-2"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/10 group-hover:bg-white/10 group-hover:border-white/40' : 'bg-white border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)] group-hover:bg-slate-50'}`}>
                      <dockApp.icon size={18} strokeWidth={1.5} className={`transition-opacity ${settings?.theme === 'monochrome-dark' ? 'text-white opacity-70 group-hover:opacity-100' : 'text-slate-800'}`} />
                    </div>
                    <span className={`text-[9px] uppercase tracking-[0.1em] transition-opacity
                      ${settings?.theme === 'monochrome-dark' ? 'text-white/40 group-hover:text-white font-medium' : 'text-slate-600 font-extrabold'}`}>{dockApp.label}</span>
                  </button>
                ))}
              </div>

            </motion.div>
          )}

          {(user || isGuest) && currentView === 'tasks' && <TaskView onBack={() => setCurrentView('home')} user={user || ({ uid: 'guest' } as any)} />}
          {(user || isGuest) && currentView === 'focus' && <FocusView onBack={() => setCurrentView('home')} user={user || ({ uid: 'guest' } as any)} settings={settings} />}
          {(user || isGuest) && currentView === 'vox' && <VoxAssistant onBack={() => setCurrentView('home')} settings={settings} />}
          {(user || isGuest) && currentView === 'settings' && <SettingsView onBack={() => setCurrentView('home')} user={user || ({ uid: 'guest' } as any)} settings={settings} setView={setCurrentView} createFolder={createFolder} onUpdateSettings={updateSettings} onSignOut={handleSignOut} />}
          {(user || isGuest) && currentView === 'history' && <FocusHistoryView onBack={() => setCurrentView('home')} user={user || ({ uid: 'guest' } as any)} settings={settings} />}
          {(user || isGuest) && currentView === 'about' && <AboutPage onBack={() => setCurrentView('settings')} />}
          {(user || isGuest) && currentView === 'app-info' && <AppInfoPage onBack={() => setCurrentView('settings')} user={user || ({ uid: 'guest' } as any)} />}
          {(user || isGuest) && currentView === 'privacy' && <PrivacyPolicyPage onBack={() => setCurrentView('settings')} />}
          {(user || isGuest) && currentView === 'guide' && <UserGuidePage onBack={() => setCurrentView('settings')} />}
          {(user || isGuest) && currentView === 'blueprint' && <BlueprintPage onBack={() => setCurrentView('settings')} />}
        </AnimatePresence>

          {(user || isGuest) && !showSplash && <BottomNav />}
        </>
      )}
    </div>
  );
}

// --- Sub-Views ---

const AboutPage = ({ onBack }: { onBack: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-8 overflow-y-auto scrollbar-hide pb-32">
    <button onClick={onBack} className="mb-12"><ChevronLeft size={24} /></button>
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className="text-5xl font-thin tracking-tighter uppercase">About VOX MONO</h1>
        <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold">Designed for Focus. Built for Clarity.</p>
      </header>
      <div className="space-y-8 text-sm leading-relaxed opacity-90">
        <p>VOX MONO is not a launcher. It is a digital sanctuary engineered to reclaim your cognitive sovereignty from the attention economy.</p>
        <div className="grid gap-6">
          <div className="p-8 bg-gray-100 dark:bg-white/5 rounded-[2.5rem] border border-black/5 shadow-sm">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black mb-4">The Mission</h3>
            <p className="text-xs leading-relaxed opacity-70">To eliminate digital friction and psychological manipulation built into modern interfaces. We provide a calm, monochromatic environment where utility precedes impulse.</p>
          </div>
          <div className="p-8 bg-gray-100 dark:bg-white/5 rounded-[2.5rem] border border-black/5 shadow-sm">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black mb-4">Digital Minimalism</h3>
            <p className="text-xs leading-relaxed opacity-70">Inspired by the 'Nothing Phone' philosophy and Stoic discipline, VOX strips away color and chaos, leaving only the tools you need to build your world.</p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const AppInfoPage = ({ onBack, user }: { onBack: () => void, user: FirebaseUser }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-8 overflow-y-auto scrollbar-hide pb-32">
    <button onClick={onBack} className="mb-12"><ChevronLeft size={24} /></button>
    <h1 className="text-4xl font-thin tracking-tighter uppercase mb-12">System Status</h1>
    <div className="space-y-6">
      {[
        { label: 'Sovereign Release', value: '2.0.4-LTS' },
        { label: 'Neural Status', value: 'STABLE' },
        { label: 'User Identity', value: user.uid.substring(0, 16).toUpperCase() },
        { label: 'Digital Filter', value: 'OPERATIONAL' },
        { label: 'Memory Partition', value: 'ENCRYPTED' },
        { label: 'Cloud Protocol', value: 'FIRESTORE v9' },
      ].map(item => (
        <div key={item.label} className="flex justify-between items-center py-4 border-b border-gray-100 dark:border-white/5">
          <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">{item.label}</span>
          <span className="text-xs font-mono">{item.value}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

const PrivacyPolicyPage = ({ onBack }: { onBack: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-8 overflow-y-auto scrollbar-hide pb-32">
    <button onClick={onBack} className="mb-12"><ChevronLeft size={24} /></button>
    <div className="space-y-12">
      <h1 className="text-4xl font-thin tracking-tighter uppercase">Privacy Shield</h1>
      <div className="space-y-8 text-xs leading-relaxed">
        <section className="space-y-4">
          <h2 className="uppercase tracking-widest font-black opacity-80">Local-First Protocol</h2>
          <p className="opacity-50">VOX MONO optimizes for local data processing. Your focus sessions and task metadata are encrypted and stored in your private Firestore instance, accessible only to you via Google Authentication.</p>
        </section>
        <section className="space-y-4">
          <h2 className="uppercase tracking-widest font-black opacity-80">Zero Analytics</h2>
          <p className="opacity-50">We do not employ third-party trackers, heatmaps, or behavioral analysis tools. Your focus is yours alone. We do not sell data because we do not collect personal identifiers outside of core system requirements.</p>
        </section>
        <div className="p-6 border border-dashed border-gray-200 dark:border-white/20 rounded-3xl">
          <p className="text-[10px] uppercase tracking-widest text-center opacity-40">Privacy Policy V2.1 • Last Updated: May 2026</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const UserGuidePage = ({ onBack }: { onBack: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-8 overflow-y-auto scrollbar-hide pb-32">
    <button onClick={onBack} className="mb-12"><ChevronLeft size={24} /></button>
    <h1 className="text-4xl font-thin tracking-tighter uppercase mb-12">Focus Manual</h1>
    <div className="space-y-12">
      {[
        { title: 'Mindful Entry', desc: 'Delay impulsive app opening with a 1.5s calibration timer. Use this time to breathe and verify intent.' },
        { title: 'Deep Flow', desc: 'Activate the focus timer to enter a state of neural flow. All distractions are silenced.' },
        { title: 'System Overrides', desc: 'Configure system app links to direct your focus toward specific productive URLs.' },
        { title: 'Vox AI', desc: 'Your Stoic advisor. Ask for focus coaching when the digital noise becomes overwhelming.' },
      ].map((step, i) => (
        <div key={i} className="flex gap-6">
          <span className="text-2xl font-thin opacity-20">0{i+1}</span>
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest">{step.title}</h3>
            <p className="text-xs opacity-60 leading-relaxed">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

const CompanyProfilePage = ({ onBack }: { onBack: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-8 overflow-y-auto scrollbar-hide pb-32">
    <button onClick={onBack} className="mb-12"><ChevronLeft size={24} /></button>
    <div className="space-y-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Zap className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-thin tracking-tighter uppercase">CodeTech</h1>
            <p className="text-[8px] uppercase tracking-widest opacity-40 font-bold">Futuristic Systems</p>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-black/5">
          <h3 className="text-[10px] uppercase tracking-widest font-black mb-4">Core Vision</h3>
          <p className="text-xs opacity-60 leading-relaxed">
            CodeTech is dedicated to building clean, efficient, and purpose-driven digital ecosystems. We believe technology should serve human intent, not exploit human attention.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
            <h4 className="text-[9px] uppercase tracking-widest font-bold opacity-30 mb-2">Lead Dev</h4>
            <p className="text-xs font-medium">Sachin Sheth</p>
          </div>
          <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
            <h4 className="text-[9px] uppercase tracking-widest font-bold opacity-30 mb-2">Location</h4>
            <p className="text-xs font-medium">Digital Hub</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 mb-4 font-bold">Technology Stack</p>
        <div className="flex flex-wrap gap-2">
          {['AI Systems', 'Minimalist UI', 'Clean Code', 'Neural Flow', 'Monochrome UX'].map(tech => (
            <span key={tech} className="text-[9px] uppercase tracking-widest border border-gray-100 dark:border-white/10 px-3 py-1.5 rounded-full opacity-60">
              {tech}
            </span>
          ))}
        </div>
      </section>

      <footer className="pt-8 border-t border-gray-100 dark:border-white/5 opacity-30">
        <p className="text-[10px] uppercase tracking-widest text-center">Built for Deep Work • 2026</p>
      </footer>
    </div>
  </motion.div>
);

const BlueprintPage = ({ onBack }: { onBack: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-8 overflow-y-auto scrollbar-hide pb-32">
    <button onClick={onBack} className="mb-12"><ChevronLeft size={24} /></button>
    <div className="space-y-16">
      <header className="space-y-4">
        <h1 className="text-5xl font-thin tracking-tighter uppercase leading-tight">Strategic Blueprint</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] opacity-70 font-black">VOX MONO • Production Specification</p>
      </header>

      <section className="space-y-8">
        <div className="p-8 bg-gray-100 dark:bg-white/5 rounded-[2.5rem] border border-black/5">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-black mb-6 flex items-center gap-2">
            <Layout size={14} className="opacity-40" />
            UX Philosophy
          </h3>
          <div className="grid gap-6">
            {[
              { t: 'Low Dopamine Interface', d: 'Neutral palettes to reduce biological visual reward systems.' },
              { t: 'Intentional Interactions', d: 'Friction-by-design for addictive distraction patterns.' },
              { t: 'Cognitive Load Reduction', d: 'Stripping secondary data to prioritize primary intent.' }
            ].map(p => (
              <div key={p.t} className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest">{p.t}</p>
                <p className="text-[10px] opacity-60 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
           <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 border-b border-black/10 dark:border-white/10 pb-2">Release Architecture</h3>
           <div className="grid gap-6">
             <div className="space-y-2">
               <p className="text-xs font-black uppercase tracking-widest">Deployment Pipeline</p>
               <p className="text-[10px] opacity-60 leading-relaxed">Automated APK signing with RSA-4096 keys. Continuous integration via GitHub Actions for production-grade builds. Versioned naming convention (vX.X.X-PROD) with OTA update differential strategy.</p>
             </div>
             <div className="space-y-2">
               <p className="text-xs font-black uppercase tracking-widest">Global Distribution</p>
               <p className="text-[10px] opacity-60 leading-relaxed">Play Store deployment flow with staged rollouts (1%, 5%, 25%, 100%). Integrated crash monitoring via Sentry/Firebase for real-time diagnostic reporting.</p>
             </div>
           </div>
        </div>

        <div className="space-y-8">
           <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 border-b border-black/10 dark:border-white/10 pb-2">Business Logic</h3>
           <div className="p-8 bg-black text-white rounded-[2.5rem] space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.3em]">VOX MONO PRO</h4>
             <div className="grid grid-cols-2 gap-4">
                {['Advanced AI Analytics', 'Cloud Sync RSA', 'Custom Matrix Themes', 'Batch Focus Packs', 'Priority Support', 'Lifetime Sovereign'].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="text-[9px] uppercase tracking-widest opacity-70">{f}</span>
                  </div>
                ))}
             </div>
           </div>
        </div>

        <div className="space-y-8">
           <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 border-b border-black/10 dark:border-white/10 pb-2">AI Neural Layer</h3>
           <div className="grid gap-4">
             {[
               { n: 'Local Engine', p: 'On-device habit analysis & pattern recognition.' },
               { n: 'Cloud Logic', p: 'Deep productivity recommendations via LLM proxy.' },
               { n: 'Memory Engine', p: 'Contextual recall of deep-work session outcomes.' }
             ].map(a => (
               <div key={a.n} className="p-5 border border-black/5 dark:border-white/10 rounded-2xl">
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1">{a.n}</p>
                 <p className="text-[9px] opacity-60 tracking-wider font-medium">{a.p}</p>
               </div>
             ))}
           </div>
        </div>

        <div className="space-y-8">
           <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 border-b border-black/10 dark:border-white/10 pb-2">Future Ecosystem</h3>
           <div className="flex flex-wrap gap-3">
             {['VOX Desktop', 'VOX Watch OS', 'VOX Browser Extension', 'VOX Focus Network'].map(e => (
               <span key={e} className="px-5 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-[9px] uppercase font-black tracking-widest border border-black/5">
                 {e}
               </span>
             ))}
           </div>
        </div>

        <div className="pt-20 text-center space-y-8">
          <div className="w-16 h-px bg-black/10 dark:bg-white/10 mx-auto" />
          <p className="text-sm font-thin tracking-tight leading-relaxed max-w-xs mx-auto">
            VOX MONO is not designed to maximize screen time. It is designed to protect attention. In a world engineered for distraction, VOX MONO creates an intentional digital environment focused on clarity, discipline, and mindful technology.
          </p>
          <div className="space-y-1">
             <p className="text-[8px] uppercase tracking-[0.4em] font-black opacity-40">Built by | CodeTech</p>
             <p className="text-[8px] uppercase tracking-[0.4em] font-black opacity-40">Lead Architect | Sachin Sheth</p>
          </div>
        </div>
      </section>
    </div>
  </motion.div>
);

const TaskView = ({ onBack, user }: { onBack: () => void, user: FirebaseUser }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const isArchived = (task: Task) => {
    if (!task.completed) return false;
    const compTime = task.completedAt ? new Date(task.completedAt).getTime() : new Date(task.createdAt).getTime();
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    return now - compTime >= dayInMs;
  };

  useEffect(() => {
    if (user.uid === 'guest') {
      const savedTasks = localStorage.getItem('vox_guest_tasks');
      if (savedTasks) {
        try {
          const parsed = JSON.parse(savedTasks) as Task[];
          // Filter out archived ones for the active view
          setTasks(parsed.filter(t => !isArchived(t)));
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }
    const q = query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      let fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      
      // Filter out tasks completed more than 24h ago (Auto-Archive)
      fetchedTasks = fetchedTasks.filter(t => !isArchived(t));

      const savedOrder = localStorage.getItem(`vox_task_order_${user.uid}`);
      if (savedOrder) {
        try {
          const orderArr = JSON.parse(savedOrder) as string[];
          const orderMap = new Map(orderArr.map((id, index) => [id, index]));
          fetchedTasks.sort((a, b) => {
            const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
            const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
            if (indexA === indexB) {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return indexA - indexB;
          });
        } catch (e) {
          console.error(e);
        }
      }
      setTasks(fetchedTasks);
    });
  }, [user]);

  const handleReorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    const orderArr = newTasks.map(t => t.id);
    localStorage.setItem(`vox_task_order_${user.uid}`, JSON.stringify(orderArr));
    
    if (user.uid === 'guest') {
      localStorage.setItem('vox_guest_tasks', JSON.stringify(newTasks));
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    const taskData = {
      userId: user.uid,
      title: newTask,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: priority
    };

    if (user.uid === 'guest') {
      const savedTasks = localStorage.getItem('vox_guest_tasks');
      let allTasks: Task[] = [];
      if (savedTasks) {
        try {
          allTasks = JSON.parse(savedTasks);
        } catch (e) {}
      }
      const newTaskObj: Task = { id: `task-${Date.now()}`, ...taskData };
      const updatedAll = [newTaskObj, ...allTasks];
      localStorage.setItem('vox_guest_tasks', JSON.stringify(updatedAll));
      setTasks(updatedAll.filter(t => !isArchived(t)));
      localStorage.setItem('vox_task_order_guest', JSON.stringify(updatedAll.filter(t => !isArchived(t)).map(t => t.id)));
      setNewTask('');
      return;
    }

    const docRef = await addDoc(collection(db, 'users', user.uid, 'tasks'), taskData);
    const savedOrder = localStorage.getItem(`vox_task_order_${user.uid}`);
    let orderArr: string[] = [];
    if (savedOrder) {
      try {
        orderArr = JSON.parse(savedOrder);
      } catch (e) {}
    }
    orderArr = [docRef.id, ...orderArr];
    localStorage.setItem(`vox_task_order_${user.uid}`, JSON.stringify(orderArr));
    setNewTask('');
  };

  const toggleTask = async (task: Task) => {
    const isNowCompleted = !task.completed;
    const completedAt = isNowCompleted ? new Date().toISOString() : null;
    
    try {
      if (navigator.vibrate) {
        navigator.vibrate(12); // Standard haptic vibration
      }
    } catch (e) {}

    if (user.uid === 'guest') {
      const savedTasks = localStorage.getItem('vox_guest_tasks');
      let allTasks: Task[] = [];
      if (savedTasks) {
        try {
          allTasks = JSON.parse(savedTasks);
        } catch (e) {}
      }
      const updatedAll = allTasks.map(t => t.id === task.id ? { ...t, completed: isNowCompleted, completedAt } : t);
      localStorage.setItem('vox_guest_tasks', JSON.stringify(updatedAll));
      setTasks(updatedAll.filter(t => !isArchived(t)));
      return;
    }
    const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
    await updateDoc(taskRef, { completed: isNowCompleted, completedAt });
  };

  const deleteTask = async (id: string) => {
    if (user.uid === 'guest') {
      const savedTasks = localStorage.getItem('vox_guest_tasks');
      let allTasks: Task[] = [];
      if (savedTasks) {
        try {
          allTasks = JSON.parse(savedTasks);
        } catch (e) {}
      }
      const updatedAll = allTasks.filter(t => t.id !== id);
      localStorage.setItem('vox_guest_tasks', JSON.stringify(updatedAll));
      setTasks(tasks.filter(t => t.id !== id));
      return;
    }
    await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
  };

  const priorityColors = {
    high: 'text-red-500',
    medium: 'text-gray-500',
    low: 'text-gray-300'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-8"
    >
      <div className="flex items-center gap-4 mb-12">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-2xl tracking-tighter uppercase font-light">Mission Control</h2>
      </div>

      <form onSubmit={addTask} className="space-y-4 mb-8">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="New Objective..."
            className="flex-1 bg-transparent border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black transition-colors"
          />
          <button type="submit" className="p-2 hover:opacity-50 transition-opacity">
            <Plus size={20} />
          </button>
        </div>
        <div className="flex gap-3">
          {(['low', 'medium', 'high'] as const).map(p => (
            <button 
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${priority === p ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-400'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </form>

      <Reorder.Group axis="y" values={tasks} onReorder={handleReorderTasks} className="flex-1 overflow-y-auto space-y-4 scrollbar-hide py-2">
        {tasks.map(task => (
          <Reorder.Item key={task.id} value={task}>
            <motion.div 
              layout
              animate={task.completed ? { x: [0, -1.5, 1.5, -1, 1, 0] } : {}}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex items-center gap-3 group bg-transparent hover:bg-gray-50/50 dark:hover:bg-white/5 p-3 rounded-2xl border border-transparent hover:border-black/5 dark:hover:border-white/5 transition-all cursor-grab active:cursor-grabbing"
            >
              <div className="text-gray-300 dark:text-gray-700 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors">
                <MoreVertical size={16} className="cursor-grab" />
              </div>
              <button 
                onClick={() => toggleTask(task)}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-300 relative overflow-hidden haptic-click-feedback
                  ${task.completed ? 'bg-black border-black/80 scale-105 shadow-sm' : 'border-gray-300 hover:border-gray-400'}`}
              >
                <AnimatePresence initial={false}>
                  {task.completed && (
                    <motion.div
                      key="checkmark"
                      initial={{ scale: 0, opacity: 0, rotate: -20 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 15 }}
                      className="flex items-center justify-center w-full h-full"
                    >
                      <ArrowRight size={12} className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              <div className="flex-1 flex flex-col">
                <span className={`text-sm ${task.completed ? 'line-through opacity-30 text-gray-500' : ''}`}>
                  {task.title}
                </span>
                {!task.completed && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Flag size={8} className={priorityColors[task.priority]} fill="currentColor" />
                    <span className={`text-[8px] uppercase tracking-widest font-bold ${priorityColors[task.priority]}`}>{task.priority}</span>
                  </div>
                )}
              </div>
              <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all">
                <Trash2 size={14} />
              </button>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </motion.div>
  );
};

const FocusView = ({ onBack, user, settings }: { onBack: () => void, user: FirebaseUser, settings: UserSettings | null }) => {
  const [timeLeft, setTimeLeft] = useState((settings?.focusDuration || 25) * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const [ambientType, setAmbientType] = useState<'rain' | 'white'>('rain');
  const [showFinishVisual, setShowFinishVisual] = useState(false);
  const [coachingMessage, setCoachingMessage] = useState('Initialize your flow.');
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const sourceNodeRef = React.useRef<AudioBufferSourceNode | null>(null);
  const filterNodeRef = React.useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = React.useRef<GainNode | null>(null);

  React.useEffect(() => {
    let unmounted = false;

    const stopAmbientAudio = () => {
      try {
        if (sourceNodeRef.current) {
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
          sourceNodeRef.current = null;
        }
        if (filterNodeRef.current) {
          filterNodeRef.current.disconnect();
          filterNodeRef.current = null;
        }
        if (gainNodeRef.current) {
          gainNodeRef.current.disconnect();
          gainNodeRef.current = null;
        }
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
          audioCtxRef.current = null;
        }
      } catch (err) {
        console.error("Ambient noise stop failed:", err);
      }
    };

    const startAmbientAudio = () => {
      try {
        stopAmbientAudio();

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        if (ambientType === 'white') {
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
        } else {
          // Rain / pink noise approximation
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11;
            b6 = white * 0.115926;
          }
        }

        if (unmounted) return;

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        sourceNodeRef.current = source;

        const filter = ctx.createBiquadFilter();
        filterNodeRef.current = filter;

        const gain = ctx.createGain();
        gainNodeRef.current = gain;

        if (ambientType === 'rain') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(650, ctx.currentTime);
          gain.gain.setValueAtTime(0.32, ctx.currentTime);
        } else {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1100, ctx.currentTime);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
        }

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start(0);
      } catch (err) {
        console.error("Ambient noise start failed:", err);
      }
    };

    if (isActive && ambientEnabled) {
      startAmbientAudio();
    } else {
      stopAmbientAudio();
    }

    return () => {
      unmounted = true;
      stopAmbientAudio();
    };
  }, [isActive, ambientEnabled, ambientType]);

  useEffect(() => {
    if (user.uid === 'guest') {
      const savedSessions = localStorage.getItem('vox_guest_sessions');
      if (savedSessions) {
        try {
          setSessions(JSON.parse(savedSessions));
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }
    const qS = query(collection(db, 'users', user.uid, 'sessions'), orderBy('startTime', 'desc'), limit(50));
    return onSnapshot(qS, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FocusSession)));
    });
  }, [user]);

  const coachingPrompts = [
    "Focus is a muscle. Train it.",
    "Breathe. The noise is temporary.",
    "One task. Zero compromise.",
    "Deep work is rare. Value it.",
    "You are the architect of your attention.",
    "Silence the world, listen to the build.",
    "Flow is where mastery lives."
  ];

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        if (timeLeft % 300 === 0) { // Every 5 mins
          setCoachingMessage(coachingPrompts[Math.floor(Math.random() * coachingPrompts.length)]);
        }
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      
      // Synthesize elegant chime-chord when timer hits 0
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const tCtx = new AudioContextClass();
          const tNow = tCtx.currentTime;
          [220, 330, 440, 550].forEach((f, idx) => {
            const osc = tCtx.createOscillator();
            const gain = tCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, tNow);
            gain.gain.setValueAtTime(0, tNow);
            gain.gain.linearRampToValueAtTime(0.12, tNow + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, tNow + 1.2 + idx * 0.2);
            osc.connect(gain);
            gain.connect(tCtx.destination);
            osc.start(tNow);
            osc.stop(tNow + 2.0);
          });
        }
      } catch (audioErr) {
        console.error("Failed to play flow completion chime", audioErr);
      }

      // Haptic vibration feedback
      try {
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100, 50, 200]);
        }
      } catch (vibErr) {}

      // Open visual alarm overlay
      setShowFinishVisual(true);

      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionComplete = async () => {
    const sessionData = {
      userId: user.uid,
      startTime: new Date(Date.now() - (mode === 'work' ? (settings?.focusDuration || 25) : (settings?.breakDuration || 5)) * 60000).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: mode === 'work' ? (settings?.focusDuration || 25) : (settings?.breakDuration || 5),
      type: mode,
      completed: true
    };

    if (user.uid === 'guest') {
      const savedSessions = localStorage.getItem('vox_guest_sessions');
      let parsedSessions: FocusSession[] = [];
      if (savedSessions) {
        try {
          parsedSessions = JSON.parse(savedSessions);
        } catch (e) {
          console.error(e);
        }
      }
      const newSession: FocusSession = { id: `session-${Date.now()}`, ...sessionData };
      const updatedSessions = [newSession, ...parsedSessions];
      localStorage.setItem('vox_guest_sessions', JSON.stringify(updatedSessions));
    } else {
      await addDoc(collection(db, 'users', user.uid, 'sessions'), sessionData);
    }
    
    const newMode = mode === 'work' ? 'break' : 'work';
    setMode(newMode);
    setTimeLeft((newMode === 'work' ? (settings?.focusDuration || 25) : (settings?.breakDuration || 5)) * 60);
    setCoachingMessage(newMode === 'break' ? 'Well earned rest. Calibrating...' : 'Ready for the next sprint?');
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    if (!isActive) setCoachingMessage("Flow sequence initiated.");
    else setCoachingMessage("Flow paused. Don't let it drift.");
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft((mode === 'work' ? (settings?.focusDuration || 25) : (settings?.breakDuration || 5)) * 60);
    setCoachingMessage("Sequence reset.");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const weeklyData = (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        dateStr: d.toDateString(),
        dayName: days[d.getDay()],
        duration: 0
      };
    }).reverse();

    sessions.forEach(session => {
      if (!session.startTime || session.type !== 'work' || !session.completed) return;
      const sessionDate = new Date(session.startTime).toDateString();
      const match = last7Days.find(day => day.dateStr === sessionDate);
      if (match) {
        match.duration += session.durationMinutes || 0;
      }
    });

    return last7Days.map(day => ({
      name: day.dayName,
      Duration: day.duration
    }));
  })();

  const isDark = settings?.theme === 'monochrome-dark';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex-1 flex flex-col items-center justify-start px-5 py-4 overflow-y-auto scrollbar-hide relative transition-colors duration-300 ${isDark ? 'bg-[#0a0a0c] text-white' : 'bg-[#fcfcfa] text-slate-800'}`}
    >
      {/* Visual Completion Alert Banner */}
      <AnimatePresence>
        {showFinishVisual && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`absolute top-4 left-4 right-4 z-50 p-5 rounded-[1.75rem] border flex flex-col gap-2.5 shadow-xl transition-all
              ${isDark ? 'bg-zinc-900 text-white border-white/10 shadow-black/60' : 'bg-white text-slate-800 border-slate-200/80 shadow-slate-100'}`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-green-500" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-black leading-none">Flow Complete</span>
            </div>
            <p className="text-[11px] opacity-75 font-serif leading-relaxed">
              Your deep work sprint has successfully concluded. Your focus shield remains untethered. Take a deep breath.
            </p>
            <button
              onClick={() => setShowFinishVisual(false)}
              className={`mt-1.5 px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest font-black transition-all
                ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
            >
              Acknowledge Block
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Breathing Ambient */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-0 bottom-0 pointer-events-none flex items-center justify-center min-h-[800px]"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.03, 0.1, 0.03]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  delay: i * 2,
                  ease: "easeInOut"
                }}
                className={`absolute border rounded-full ${isDark ? 'border-white' : 'border-slate-400'}`}
                style={{ width: `${300 + i * 200}px`, height: `${300 + i * 200}px` }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex items-center justify-between z-10 mb-6">
        <button onClick={onBack} className={`p-2.5 rounded-xl transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>
          <ChevronLeft size={18} />
        </button>
        <div className={`flex p-1 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
           {(['work', 'break'] as const).map(m => (
             <button 
              key={m}
              onClick={() => {
                setMode(m);
                setTimeLeft((m === 'work' ? (settings?.focusDuration || 25) : (settings?.breakDuration || 5)) * 60);
                setIsActive(false);
                setCoachingMessage(m === 'work' ? 'Ready to build?' : 'Recharge and reset.');
              }}
              className={`text-[9px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl transition-all font-black ${mode === m ? (isDark ? 'bg-white text-black' : 'bg-slate-900 text-white') : 'opacity-40 text-current'}`}
             >
               {m}
             </button>
           ))}
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="text-center space-y-6 w-full z-10 py-2">
        <div className="space-y-4">
           <div className={`flex items-center gap-4 justify-center px-4 py-2 rounded-full border max-w-fit mx-auto ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-150/70 border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.01)]'}`}>
             <div className="flex flex-col items-center">
               <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-white/40 mb-0.5">Blocked</span>
               <span className="text-xs font-black font-mono">42</span>
             </div>
             <div className={`w-px h-5 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
             <div className="flex flex-col items-center">
               <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-white/40 mb-0.5">Shield</span>
               <ShieldCheck size={12} className="text-green-500" />
             </div>
             <div className={`w-px h-5 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
             <div className="flex flex-col items-center">
               <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-white/40 mb-0.5">Status</span>
               <span className="text-xs font-black">SOVEREIGN</span>
             </div>
           </div>
           {isActive && <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="text-[9px] uppercase tracking-[0.25em] font-black text-red-500 font-mono">Distraction Firewall Engaged</motion.div>}
        </div>
        
        <div className="relative inline-block w-full">
          <h2 className="text-[7.5rem] md:text-[8rem] font-extralight tracking-[-0.05em] leading-none select-none text-glow leading-none">
            {formatTime(timeLeft).split(':')[0]}
            <span className="opacity-25">:</span>
            {formatTime(timeLeft).split(':')[1]}
          </h2>
          <AnimatePresence mode="wait">
            <motion.p 
              key={coachingMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-slate-500 dark:text-white/40 mt-4 min-h-[1.5em] font-mono"
            >
              {coachingMessage}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full flex-col flex items-center gap-5 z-10 pb-6 mt-3">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-6">
             <button 
              onClick={() => setAmbientEnabled(!ambientEnabled)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all ${ambientEnabled ? (isDark ? 'bg-white text-black border-white' : 'bg-slate-900 text-white border-slate-900') : (isDark ? 'border-white/10 opacity-30 hover:opacity-100' : 'border-slate-200 opacity-60 hover:opacity-100 bg-slate-50')}`}
              title="Toggle Deep Work Sounds"
             >
              <Activity size={18} strokeWidth={1.5} />
            </button>

            <button 
              onClick={toggleTimer}
              className={`w-20 h-20 rounded-full border flex items-center justify-center group transition-all duration-700 shadow-xl
                ${isActive 
                  ? (isDark ? 'bg-white border-white scale-105 text-black' : 'bg-slate-950 border-slate-950 scale-105 text-white') 
                  : (isDark ? 'bg-transparent border-white/30 text-white hover:bg-white/5' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50')}`}
            >
              {!isActive ? (
                 <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }}>
                   <Plus size={24} strokeWidth={1.5} />
                 </motion.div>
              ) : (
                 <div className={`w-4 h-4 rounded-sm ${isDark ? 'bg-black' : 'bg-white'}`} />
              )}
            </button>

            <button 
              onClick={resetTimer}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all ${isDark ? 'border-white/10 opacity-30 hover:opacity-100' : 'border-slate-200 opacity-60 hover:opacity-100 bg-slate-50'}`}
              title="Reset Sequence"
            >
              <RotateCcw size={18} strokeWidth={1.5} />
            </button>
          </div>

          <AnimatePresence>
            {ambientEnabled && (
              <motion.div 
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                className={`flex items-center gap-1 p-1 border rounded-full ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200/50'}`}
              >
                <button
                  type="button"
                  onClick={() => setAmbientType('rain')}
                  className={`text-[8px] uppercase tracking-[0.15em] px-3 py-1 rounded-full font-extrabold transition-all ${ambientType === 'rain' ? (isDark ? 'bg-white text-black' : 'bg-slate-900 text-white') : 'opacity-40 text-current'}`}
                >
                  Rain Forest
                </button>
                <button
                  type="button"
                  onClick={() => setAmbientType('white')}
                  className={`text-[8px] uppercase tracking-[0.15em] px-3 py-1 rounded-full font-extrabold transition-all ${ambientType === 'white' ? (isDark ? 'bg-white text-black' : 'bg-slate-900 text-white') : 'opacity-40 text-current'}`}
                >
                  White Noise
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          {[15, 30, 45, 60, 90].map(mins => (
            <button 
              key={mins}
              onClick={() => {
                setTimeLeft(mins * 60);
                setIsActive(true);
                setCoachingMessage(`Setting ${mins}m block.`);
              }}
              className={`text-[8px] uppercase tracking-[0.15em] px-3.5 py-1.5 border rounded-full transition-all font-black
                ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'}`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Visual Weekly Focus Chart Section */}
      <div className={`w-full max-w-sm mt-8 pt-8 border-t space-y-4 pb-20 z-10 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className={`text-[10px] uppercase tracking-[0.2em] font-extrabold ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Weekly Focus Summary</h3>
            <p className={`text-[8px] uppercase tracking-wider font-mono ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Completed work sessions</p>
          </div>
          <span className={`text-[8px] font-mono uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-slate-400 font-bold'}`}>MINUTES SELECT</span>
        </div>
        
        <div className={`border rounded-[1.75rem] p-4 h-[160px] w-full flex items-center justify-center relative
          ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200/80 shadow-[0_3px_12px_rgba(0,0,0,0.01)]'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                stroke={isDark ? "rgba(255,255,255,0.4)" : "rgba(100,116,139,0.7)"} 
                fontSize={8} 
                tickLine={false} 
                axisLine={false}
                dy={10} 
                fontWeight="bold"
              />
              <Tooltip 
                cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' }} 
                contentStyle={{ 
                  backgroundColor: isDark ? '#121212' : '#ffffff', 
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', 
                  borderRadius: '12px',
                  fontSize: '10px',
                  color: isDark ? '#fff' : '#0f172a',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }} 
                labelStyle={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', fontWeight: 'bold' }}
              />
              <Bar 
                dataKey="Duration" 
                fill={isDark ? "#ffffff" : "#0f172a"} 
                radius={[4, 4, 0, 0]} 
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center px-1">
          <span className={`text-[8.5px] uppercase tracking-wider font-mono font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Today: {weeklyData[6]?.Duration || 0}m logged</span>
          <span className={`text-[8.5px] uppercase tracking-wider font-mono font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Weekly Peak: {Math.max(...weeklyData.map(d => d.Duration), 0)}m</span>
        </div>
      </div>
    </motion.div>
  );
};

const FocusHistoryView = ({ onBack, user, settings }: { onBack: () => void, user: FirebaseUser, settings: UserSettings | null }) => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'sessions' | 'missions'>('sessions');

  useEffect(() => {
    if (user.uid === 'guest') {
      const savedSessions = localStorage.getItem('vox_guest_sessions');
      if (savedSessions) {
        try {
          setSessions(JSON.parse(savedSessions));
        } catch (e) {
          console.error(e);
        }
      }
      const savedTasks = localStorage.getItem('vox_guest_tasks');
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks) as Task[];
          setCompletedTasks(parsedTasks.filter(t => t.completed));
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    const qS = query(collection(db, 'users', user.uid, 'sessions'), orderBy('startTime', 'desc'), limit(50));
    const unsubS = onSnapshot(qS, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FocusSession)));
    });

    const qT = query(collection(db, 'users', user.uid, 'tasks'), where('completed', '==', true), orderBy('createdAt', 'desc'), limit(50));
    const unsubT = onSnapshot(qT, (snapshot) => {
      setCompletedTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });

    return () => { unsubS(); unsubT(); };
  }, [user]);

  const isDark = settings?.theme === 'monochrome-dark';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`flex-1 flex flex-col px-5 py-4 h-full overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0a0a0c] text-white' : 'bg-[#fcfcfa] text-slate-800'}`}
    >
       <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-800'}`}>
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-xl tracking-tighter uppercase font-light">Memory Bank</h2>
      </div>

      <div className={`flex p-1 rounded-2xl mb-5 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
        <button 
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 py-1.5 rounded-xl text-[9px] uppercase font-bold tracking-widest transition-all ${activeTab === 'sessions' ? (isDark ? 'bg-white text-black font-black' : 'bg-slate-900 text-white font-black') : (isDark ? 'opacity-40 text-current' : 'opacity-50 text-current')}`}
        >
          Flow Logs
        </button>
        <button 
          onClick={() => setActiveTab('missions')}
          className={`flex-1 py-1.5 rounded-xl text-[9px] uppercase font-bold tracking-widest transition-all ${activeTab === 'missions' ? (isDark ? 'bg-white text-black font-black' : 'bg-slate-900 text-white font-black') : (isDark ? 'opacity-40 text-current' : 'opacity-50 text-current')}`}
        >
          Archive
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide pb-24">
        {activeTab === 'sessions' ? (
          <>
            {sessions.length === 0 && <p className={`text-xs uppercase tracking-widest opacity-30 text-center pt-20 ${isDark ? 'text-white' : 'text-slate-500'}`}>No flow data.</p>}
            {sessions.map(s => (
              <div key={s.id} className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-white/15' : 'border-slate-200/60'}`}>
                <div>
                  <p className="text-sm font-semibold">{new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                  <p className={`text-[10px] uppercase tracking-widest font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                    {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {s.type}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-light">{s.durationMinutes}m</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {completedTasks.length === 0 && <p className="text-xs uppercase tracking-widest opacity-30 text-center pt-20">No completed missions.</p>}
            {completedTasks.map(t => (
              <div key={t.id} className="flex items-center gap-4 border-b border-white/10 pb-4">
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckSquare size={12} className="opacity-40" />
                </div>
                <div>
                  <p className="text-sm line-through opacity-40">{t.title}</p>
                  <p className="text-[8px] uppercase tracking-widest opacity-20 font-bold">{t.priority} Priority</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
};

const VoxAssistant = ({ onBack, settings }: { onBack: () => void, settings?: UserSettings | null }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'vox', text: string }[]>([
    { role: 'vox', text: "Hello. I am Vox. What is our focus today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'vox', text: data.text }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'vox', text: "Signal lost. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const isDark = settings?.theme === 'monochrome-dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className={`flex-1 flex flex-col px-5 py-4 h-full overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0a0a0c] text-white' : 'bg-[#fcfcfa] text-slate-800'}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-800'}`}>
          <ChevronLeft size={18} />
        </button>
        <div className="flex flex-col">
          <h2 className="text-xs font-bold tracking-widest uppercase">Vox Assistant</h2>
          <span className="text-[8px] uppercase tracking-widest opacity-40 font-mono">System Active</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pb-4 scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl ${m.role === 'user' ? `rounded-tr-none ${isDark ? 'bg-zinc-800/80 border border-white/5 text-white' : 'bg-slate-100 border border-slate-200 text-slate-800'}` : `rounded-tl-none ${isDark ? 'text-white' : 'text-slate-800'}`}`}>
              <p className="text-xs leading-relaxed">{m.text}</p>
            </div>
          </div>
        ))}
        {isTyping && <div className="text-[8px] font-mono uppercase tracking-widest opacity-40 animate-pulse">Calculating...</div>}
      </div>

      <form onSubmit={sendMessage} className="mt-3 flex gap-2 relative pb-20">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Query Vox..."
          className={`w-full rounded-2xl border px-5 py-3 text-xs focus:outline-none transition-colors shadow-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/35 focus:border-white/30' : 'bg-slate-50 border-slate-200/80 text-slate-800 focus:border-slate-400 placeholder-slate-400 font-medium'}`}
        />
        <button type="submit" className={`absolute right-4 top-1/2 -translate-y-[calc(50%+10px)] p-2 hover:scale-105 transition-all ${isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
          <Send size={16} />
        </button>
      </form>
    </motion.div>
  );
};

const SettingsView = ({ onBack, user, settings, setView, createFolder, onUpdateSettings, onSignOut }: { onBack: () => void, user: FirebaseUser, settings: UserSettings | null, setView: (v: View) => void, createFolder: (ids: string[]) => void, onUpdateSettings: (updates: Partial<UserSettings>) => Promise<void>, onSignOut: () => void }) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [selectedFolderApps, setSelectedFolderApps] = useState<string[]>([]);
  
  const updateSetting = async (key: string, value: any) => {
    await onUpdateSettings({ [key]: value });
  };

  const updateIdentity = async (appId: string, type: 'name' | 'icon', value: string) => {
    const key = type === 'name' ? 'customNames' : 'customIcons';
    const current = settings?.[key] || {};
    await updateSetting(key, { ...current, [appId]: value });
  };

const SectionHeader = ({ title, theme }: { title: string, theme: string | undefined }) => (
    <p className={`text-[10px] uppercase tracking-[0.3em] mb-6 font-bold ${theme === 'monochrome-dark' ? 'text-white/60' : 'text-black/60'}`}>{title}</p>
  );

  const NavItem = ({ label, icon: Icon, onClick, description }: { label: string, icon: any, onClick: () => void, description?: string }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all group ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border border-white/5 text-white hover:bg-white/10' : 'bg-white border border-black/5 text-black hover:bg-black/[0.02]'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-black/5'}`}>
          <Icon size={18} strokeWidth={1} className="opacity-40 group-hover:opacity-100" />
        </div>
        <div className="text-left">
          <span className="text-[11px] font-black uppercase tracking-widest block">{label}</span>
          {description && <span className="text-[8px] uppercase tracking-widest opacity-40 font-bold">{description}</span>}
        </div>
      </div>
      <ChevronLeft size={16} className="rotate-180 opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
    </button>
  );

  const handleAppLinkUpdate = async (appId: string, url: string) => {
    const newLinks = { ...(settings?.systemAppLinks || {}), [appId]: url };
    await updateSetting('systemAppLinks', newLinks);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex-1 flex flex-col p-8 overflow-y-auto scrollbar-hide pb-32"
    >
       <div className="flex items-center gap-4 mb-12">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-2xl tracking-tighter uppercase font-light">System Protocol</h2>
      </div>

      <div className="space-y-12">
        <section>
          <SectionHeader title="Philosophy" theme={settings?.theme} />
          <div className="space-y-3">
            <NavItem label="About VOX MONO" icon={Info} onClick={() => setView('about')} description="The Manifesto" />
            <NavItem label="CodeTech Profile" icon={Zap} onClick={() => setView('company-profile')} description="The Forge" />
            <NavItem label="Focus Guide" icon={Book} onClick={() => setView('guide')} description="Operative Manual" />
            <NavItem label="System Status" icon={Cpu} onClick={() => setView('app-info')} description="Diagnostics" />
            <NavItem label="Strategic Roadmap" icon={FileText} onClick={() => setView('blueprint')} description="Product Blueprint" />
            <NavItem label="Privacy Shield" icon={Shield} onClick={() => setView('privacy')} description="Data Sovereignty" />
          </div>
        </section>

        <section>
          <SectionHeader title="Aesthetics" theme={settings?.theme} />
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl">
            <button 
              onClick={() => updateSetting('theme', 'monochrome-light')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl transition-all ${settings?.theme === 'monochrome-light' ? 'bg-white shadow-sm' : 'opacity-40'}`}
            >
              <Sun size={14} />
              <span className="text-[10px] uppercase font-bold tracking-widest">Day Mode</span>
            </button>
            <button 
              onClick={() => updateSetting('theme', 'monochrome-dark')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl transition-all ${settings?.theme === 'monochrome-dark' ? 'bg-black text-white shadow-sm' : 'opacity-40'}`}
            >
              <Moon size={14} />
              <span className="text-[10px] uppercase font-bold tracking-widest">Night Mode</span>
            </button>
          </div>
        </section>

        <section>
           <SectionHeader title="Folders" theme={settings?.theme} />
           <div className="space-y-4">
             {settings?.folders?.length === 0 && <p className="text-[10px] uppercase tracking-widest opacity-30 text-center py-8">No clusters defined.</p>}
             {settings?.folders?.map(folder => (
               <div key={folder.id} className={`flex flex-col gap-4 p-6 rounded-[2rem] border transition-all ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-premium shadow-black/[0.02]'}`}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${settings?.theme === 'monochrome-dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                          <Layout size={14} className="opacity-60" />
                        </div>
                        <input 
                          value={folder.name}
                          onChange={async (e) => {
                            const updated = settings.folders?.map(f => f.id === folder.id ? { ...f, name: e.target.value } : f) || [];
                            await updateSetting('folders', updated);
                          }}
                          className={`bg-transparent text-[11px] uppercase font-black tracking-widest outline-none border-b border-transparent focus:border-current flex-1 min-w-0 ${settings?.theme === 'monochrome-dark' ? 'text-white' : 'text-black'}`}
                        />
                    </div>
                    <button 
                      onClick={async () => {
                        const updated = settings.folders?.filter(f => f.id !== folder.id) || [];
                        await updateSetting('folders', updated);
                      }}
                      className="p-2 opacity-20 hover:opacity-100 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>
               </div>
             ))}

             {isCreatingFolder ? (
               <div className="p-8 border border-black/10 dark:border-white/10 rounded-[2.5rem] space-y-6">
                 <p className="text-[10px] uppercase tracking-widest font-black opacity-40">Select Apps to Group</p>
                 <div className="grid grid-cols-2 gap-3">
                   {[...APPS, ...MOCKED_SYSTEM_APPS].map(app => (
                     <button 
                       key={app.id}
                       onClick={() => setSelectedFolderApps(prev => prev.includes(app.id) ? prev.filter(id => id !== app.id) : [...prev, app.id])}
                       className={`p-3 rounded-2xl text-[10px] uppercase font-black tracking-widest border transition-all ${selectedFolderApps.includes(app.id) ? 'bg-black text-white border-black' : 'border-gray-100 opacity-40'}`}
                     >
                       {app.name}
                     </button>
                   ))}
                 </div>
                 <div className="flex gap-2 pt-2">
                   <button 
                     onClick={() => {
                        if (selectedFolderApps.length > 0) createFolder(selectedFolderApps);
                        setIsCreatingFolder(false);
                        setSelectedFolderApps([]);
                     }}
                     className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] uppercase font-black tracking-widest"
                   >
                     Confirm
                   </button>
                   <button 
                     onClick={() => setIsCreatingFolder(false)}
                     className="flex-1 py-4 border border-black/10 rounded-2xl text-[10px] uppercase font-black tracking-widest opacity-40"
                   >
                     Cancel
                   </button>
                 </div>
               </div>
             ) : (
               <button 
                onClick={() => setIsCreatingFolder(true)} 
                className="w-full py-6 rounded-[2rem] border border-dashed border-black/20 dark:border-white/20 text-[10px] uppercase font-black tracking-widest opacity-40 hover:opacity-100 transition-all"
               >
                 + Initialize New Cluster
               </button>
             )}
           </div>
        </section>

        <section>
          <SectionHeader title="App Identity" theme={settings?.theme} />
          <div className="space-y-6">
            {[...APPS, ...MOCKED_SYSTEM_APPS].map(app => (
              <div key={app.id} className={`p-6 rounded-[2rem] border transition-all ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-premium shadow-black/[0.02]'}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-2xl ${settings?.theme === 'monochrome-dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                    {(LucideIcons as any)[settings?.customIcons?.[app.id] || ICON_MAP[app.id] || 'Globe'] ? React.createElement((LucideIcons as any)[settings?.customIcons?.[app.id] || ICON_MAP[app.id] || 'Globe'], { size: 14, className: 'opacity-60' }) : <Globe size={14} className="opacity-60" />}
                  </div>
                  <div className="flex-1">
                    <input 
                      value={settings?.customNames?.[app.id] || app.name}
                      onChange={(e) => updateIdentity(app.id, 'name', e.target.value)}
                      className={`w-full bg-transparent text-sm font-bold tracking-tight outline-none ${settings?.theme === 'monochrome-dark' ? 'text-white' : 'text-black'}`}
                      placeholder={app.name}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ICONS.slice(0, 12).map(icon => {
                    const Icon = (LucideIcons as any)[icon];
                    return (
                      <button 
                        key={icon}
                        onClick={() => updateIdentity(app.id, 'icon', icon)}
                        className={`p-2.5 rounded-xl border transition-all ${settings?.customIcons?.[app.id] === icon ? 'border-black bg-black text-white' : 'border-black/5 opacity-30 hover:opacity-100'}`}
                      >
                        <Icon size={12} />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
           <SectionHeader title="System Interlink" theme={settings?.theme} />
           <div className="space-y-6">
             {[
               { id: 'phone', label: 'Phone URL', icon: Phone },
               { id: 'messages', label: 'Messages URL', icon: MessageSquare },
               { id: 'mail', label: 'Mail URL', icon: Mail },
               { id: 'camera', label: 'Camera/Lens URL', icon: Camera },
               { id: 'browser', label: 'Browser URL', icon: Globe },
             ].map(item => (
               <div key={item.id} className="space-y-2">
                 <div className="flex items-center gap-2 px-1">
                   <item.icon size={12} className="opacity-40" />
                   <label className="text-[8px] uppercase tracking-widest font-black opacity-30">{item.label}</label>
                 </div>
                 <input 
                   type="text" 
                   value={settings?.systemAppLinks?.[item.id as keyof typeof settings.systemAppLinks] || ''}
                   onChange={(e) => handleAppLinkUpdate(item.id, e.target.value)}
                   placeholder="Enter Destination URL"
                   className={`w-full px-5 py-4 rounded-2xl text-[10px] tracking-widest uppercase outline-none border transition-all ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/10 focus:border-white/30' : 'bg-gray-50 border-black/5 focus:border-black/20'}`}
                 />
               </div>
             ))}
           </div>
        </section>

        <section>
          <SectionHeader title="Flow Rhythms (Minutes)" theme={settings?.theme} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[8px] uppercase tracking-widest opacity-40 px-1">Work</label>
              <input 
                type="number" 
                value={settings?.focusDuration || 25}
                onChange={(e) => updateSetting('focusDuration', parseInt(e.target.value))}
                className="w-full p-4 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] uppercase tracking-widest opacity-40 px-1">Break</label>
              <input 
                type="number" 
                value={settings?.breakDuration || 5}
                onChange={(e) => updateSetting('breakDuration', parseInt(e.target.value))}
                className="w-full p-4 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader title="Detox Protocol" theme={settings?.theme} />
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[8px] uppercase tracking-widest opacity-40 px-1 font-black">World Clocks (e.g. Asia/Tokyo, London)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="world-clock-input"
                  placeholder="Asia/Kolkata"
                  className={`flex-1 px-5 py-4 rounded-2xl text-[10px] tracking-widest uppercase outline-none border transition-all ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/10 focus:border-white/30' : 'bg-gray-50 border-black/5 focus:border-black/20'}`}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        const current = settings?.worldClocks || [];
                        if (!current.includes(val)) {
                          await updateSetting('worldClocks', [...current, val]);
                        }
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {settings?.worldClocks?.map(tz => (
                  <button 
                    key={tz}
                    onClick={() => updateSetting('worldClocks', settings.worldClocks.filter(t => t !== tz))}
                    className={`px-3 py-2 rounded-xl text-[8px] uppercase font-bold tracking-widest border border-black/5 hover:bg-red-50 hover:text-red-500 transition-all ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/10' : 'bg-white'}`}
                  >
                    {tz} ×
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => updateSetting('showClock', !settings?.showClock)}
              className="flex items-center justify-between w-full p-4 border border-gray-100 rounded-xl"
            >
              <div className="text-left">
                <span className="text-sm block">Display Clock</span>
                <span className="text-[8px] uppercase tracking-widest opacity-40">Main time visibility</span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings?.showClock ? 'bg-black' : 'bg-gray-200'}`}>
                <motion.div 
                  animate={{ x: settings?.showClock ? 20 : 2 }}
                  className="w-4 h-4 rounded-full bg-white absolute top-0.5"
                />
              </div>
            </button>

            <button 
              onClick={() => updateSetting('showWorldClock', !settings?.showWorldClock)}
              className="flex items-center justify-between w-full p-4 border border-gray-100 rounded-xl"
            >
              <div className="text-left">
                <span className="text-sm block">World Clocks</span>
                <span className="text-[8px] uppercase tracking-widest opacity-40">UTC / GMT Matrix</span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings?.showWorldClock ? 'bg-black' : 'bg-gray-200'}`}>
                <motion.div 
                  animate={{ x: settings?.showWorldClock ? 20 : 2 }}
                  className="w-4 h-4 rounded-full bg-white absolute top-0.5"
                />
              </div>
            </button>

            <button 
              onClick={() => updateSetting('mindfulDelayEnabled', !settings?.mindfulDelayEnabled)}
              className="flex items-center justify-between w-full p-4 border border-gray-100 rounded-xl"
            >
              <div className="text-left">
                <span className="text-sm block">Mindful Latency</span>
                <span className="text-[8px] uppercase tracking-widest opacity-40">2s pause before entry</span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings?.mindfulDelayEnabled ? 'bg-black' : 'bg-gray-200'}`}>
                <motion.div 
                  animate={{ x: settings?.mindfulDelayEnabled ? 20 : 2 }}
                  className="w-4 h-4 rounded-full bg-white absolute top-0.5"
                />
              </div>
            </button>
          </div>
        </section>

        <section>
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 mb-6 font-bold">System App Overrides</p>
          <div className="space-y-4">
            {MOCKED_SYSTEM_APPS.map(app => (
              <div key={app.id} className="space-y-2">
                <label className="text-[8px] uppercase tracking-widest opacity-40 px-1">{app.name} URL</label>
                <input 
                  type="text" 
                  value={settings?.systemAppLinks?.[app.id as keyof typeof settings.systemAppLinks] || ''}
                  onChange={(e) => handleAppLinkUpdate(app.id, e.target.value)}
                  placeholder="https://..."
                  className="w-full p-4 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-black transition-colors"
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 mb-6 font-bold">Precision Block (Websites)</p>
          <form className="space-y-4" onSubmit={(e: any) => {
            e.preventDefault();
            const val = e.target.site.value.trim();
            if (val) {
              updateSetting('blockedWebsites', [...(settings?.blockedWebsites || []), val]);
              e.target.site.value = '';
            }
          }}>
            <div className="flex gap-2">
              <input 
                name="site"
                type="text" 
                placeholder="domain.com"
                className="flex-1 p-4 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-black transition-colors"
              />
              <button type="submit" className="p-4 rounded-xl border border-black/5 hover:bg-black/5 transition-all">
                <Plus size={16} className="opacity-40" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings?.blockedWebsites?.map(site => (
                <div key={site} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full text-[10px] font-medium border border-gray-100">
                  <span>{site}</span>
                  <button onClick={() => updateSetting('blockedWebsites', settings.blockedWebsites.filter(s => s !== site))}>
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </form>
        </section>

        <section>
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 mb-6 font-bold">Visual Language (Icons)</p>
          <div className="space-y-6">
            {[...APPS, ...MOCKED_SYSTEM_APPS].map(app => (
              <div key={app.id} className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold">{app.name}</label>
                  <span className="text-[8px] opacity-30 select-none">{settings?.customIcons?.[app.id] || 'DEFAULT'}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {AVAILABLE_ICONS.map(iconName => {
                    const Icons = {
                      CheckSquare, Timer, MessageSquare, Settings, Phone, MessageCircle, Camera, Globe, Clock,
                      Lock, Shield, Layout, Layers, Zap, Target, Coffee, Book, Code
                    } as any;
                    const Icon = Icons[iconName] || Globe;
                    const isActive = (settings?.customIcons?.[app.id] || ICON_MAP[app.id]) === iconName;
                    return (
                      <button 
                        key={iconName}
                        onClick={() => {
                          const newIcons = { ...(settings?.customIcons || {}), [app.id]: iconName };
                          updateSetting('customIcons', newIcons);
                        }}
                        className={`flex-shrink-0 w-10 h-10 border rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-black text-white border-black' : 'border-gray-100 text-gray-300 hover:border-gray-300'}`}
                      >
                        <Icon size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-20">
          <button 
            onClick={onSignOut}
            className="text-xs uppercase tracking-widest text-red-500 hover:opacity-50 transition-opacity"
          >
            Decommission Account
          </button>
        </div>
      </div>
    </motion.div>
  );
};

