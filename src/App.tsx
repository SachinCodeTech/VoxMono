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

const GlobalHeader = ({ theme, view, setView, isGuest }: { theme: string | undefined, view: View, setView: (v: View) => void, isGuest?: boolean }) => (
  <header className={`px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 z-30 transition-all ${theme === 'monochrome-dark' ? 'bg-[#0a0a0a]/80' : 'bg-white/80'} backdrop-blur-xl border-b border-transparent`}>
    <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('home')}>
      <motion.div 
        whileHover={{ scale: 1.05, rotate: 180 }}
        whileTap={{ scale: 0.9 }}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'monochrome-dark' ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'bg-black shadow-premium shadow-black/10'}`}
      >
        <div className={`w-4 h-4 ${theme === 'monochrome-dark' ? 'bg-black' : 'bg-white'} rotate-45`} />
      </motion.div>
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black uppercase tracking-[0.05em] leading-none">VoxMono</span>
          <span className="hidden sm:inline text-[9px] font-black uppercase tracking-[0.4em] opacity-40 leading-none">Sovereign OS</span>
        </div>
        <span className="sm:hidden text-[8px] font-black uppercase tracking-[0.4em] opacity-40 leading-none mt-1">Sovereign OS</span>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md transition-all duration-500
          ${isGuest ? (theme === 'monochrome-dark' ? 'bg-white/10 border-white/20' : 'bg-black/5 border-black/5') : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10'}`}>
          <Activity size={10} className={isGuest ? "text-yellow-500 animate-pulse" : "text-green-500 animate-pulse"} />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-none">
            {isGuest ? 'GUEST_SYMMETRY' : 'STABLE'}
          </span>
        </div>
      </div>
    </div>
  </header>
);

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-3 group w-full relative min-h-[140px]"
    >
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`w-16 h-16 sm:w-20 sm:h-20 border rounded-[2rem] flex items-center justify-center transition-all duration-300 relative
          ${settings?.theme === 'monochrome-dark' 
            ? 'glass-dark border-white/10' 
            : 'bg-white border-black/5 shadow-premium shadow-black/[0.02]'} 
          ${isSystem ? 'border-dashed' : ''}`}
      >
        <IconComponent size={24} strokeWidth={1} className="opacity-60 transition-opacity duration-300" />
      </motion.button>

      {onEdit && (
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-black text-white dark:bg-white dark:text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
        >
          <Settings size={10} />
        </button>
      )}

      <div className="w-full min-h-[44px] flex items-start justify-center pt-2">
        <span className={`text-[9px] uppercase tracking-[0.05em] font-black transition-all duration-300 w-full text-center px-0.5 leading-tight break-words line-clamp-2
          ${settings?.theme === 'monochrome-dark' ? 'text-white/50 group-hover:text-white' : 'text-black/50 group-hover:text-black'}`}>
          {customName}
        </span>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [bootStatus, setBootStatus] = useState<'booting' | 'authenticating' | 'ready'>('booting');
  const [currentView, setCurrentView] = useState<View>('home');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [showDelay, setShowDelay] = useState(false);
  const [reorderedApps, setReorderedApps] = useState<string[]>([]);
  const [notificationPreview, setNotificationPreview] = useState<{ title: string, body: string, app: string } | null>(null);

  useEffect(() => {
    // Check if guest mode was enabled previously
    const savedGuestMode = localStorage.getItem('vox_guest_mode');
    if (savedGuestMode === 'true') {
      setIsGuest(true);
      // Initialize guest settings if they don't exist
      setSettings(prev => prev || {
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
    if (!user) return;
    const settingsDoc = doc(db, 'users', user.uid, 'settings', 'global');
    await updateDoc(settingsDoc, updates);
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
    <div className={`fixed bottom-0 inset-x-0 z-40 border-t ${settings?.theme === 'monochrome-dark' ? 'bg-[#0a0a0a]/90 border-white/10 text-white' : 'bg-white/90 border-gray-100 text-black'} backdrop-blur-xl px-4 pb-10 pt-4`}>
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
            onClick={() => setCurrentView(item.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-all relative ${currentView === item.id ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
          >
            <div className={`p-2 transition-all duration-500 relative`}>
              <item.icon size={22} strokeWidth={currentView === item.id ? 2.5 : 1} className={`relative z-10 ${currentView === item.id ? (settings?.theme === 'monochrome-dark' ? 'text-white' : 'text-black') : (settings?.theme === 'monochrome-dark' ? 'text-white/40' : 'text-black/40')}`} />
              {currentView === item.id && (
                <motion.div 
                  layoutId="activeIndicator"
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full ${settings?.theme === 'monochrome-dark' ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]' : 'bg-black shadow-[0_0_12px_rgba(0,0,0,0.2)]'}`} 
                />
              )}
            </div>
            <span className={`text-[8px] uppercase tracking-[0.25em] font-black transition-all ${currentView === item.id ? 'opacity-100' : 'opacity-40'}`}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${settings?.theme === 'monochrome-dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'} font-sans transition-colors duration-500 overflow-hidden relative selection:bg-black selection:text-white`}>
      
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

      <motion.div 
        className="max-w-md mx-auto min-h-screen flex flex-col relative" 
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
        {/* Global Header */}
        {!showSplash && (user || isGuest) && (
          <GlobalHeader theme={settings?.theme} view={currentView} setView={setCurrentView} isGuest={isGuest} />
        )}

        <AnimatePresence mode="wait">
          {(user || isGuest) && currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="flex-1 p-8 pt-10 flex flex-col pb-32"
            >
              {/* Launcher Search */}
              <div className="mb-8 relative">
                <div className={`flex items-center gap-3 px-5 py-4 rounded-3xl border ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-black/5'} transition-all focus-within:border-black/20`}>
                  <Globe size={18} className="opacity-30" />
                  <input 
                    type="text" 
                    placeholder="Search System or Web..." 
                    className="bg-transparent border-none outline-none text-xs w-full uppercase tracking-widest placeholder:opacity-40"
                  />
                </div>
              </div>

              {/* Time & Productivity Widget */}
              {settings?.showClock && (
                <div className="mb-12 flex flex-col items-center">
                  <p className="text-[10px] uppercase tracking-[0.4em] font-black opacity-30 mb-2">
                    {isGuest ? 'Guest Protocol Active' : 'Good Day, Explorer'}
                  </p>
                  <div className="relative group">
                    <motion.h2 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-8xl font-thin tracking-[-0.08em] transition-all duration-700 group-hover:tracking-normal"
                    >
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                    </motion.h2>
                    <div className="absolute -right-12 bottom-4 text-4xl font-thin tracking-tighter opacity-20">
                      {new Date().getHours() >= 12 ? 'PM' : 'AM'}
                    </div>
                  </div>

                  {settings?.showWorldClock && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-6 mt-4 opacity-30 select-none"
                    >
                      {(settings.worldClocks || [
                        'Europe/London', 
                        'America/New_York', 
                        'Asia/Tokyo'
                      ]).map(tz => {
                        try {
                          return (
                            <div key={tz} className="flex flex-col items-center">
                              <span className="text-[7px] font-black uppercase tracking-widest mb-0.5">
                                {tz.split('/').pop()?.replace('_', ' ').substring(0, 3)}
                              </span>
                              <span className="text-[10px] font-mono tracking-tighter">
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
                  
                  <div className="flex items-center gap-6 mt-6">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] uppercase tracking-widest font-black opacity-30 mb-1">Goal</span>
                      <span className="text-xs font-mono">4H 00M</span>
                    </div>
                    <div className="w-px h-6 bg-current opacity-10" />
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] uppercase tracking-widest font-black opacity-30 mb-1">Score</span>
                      <div className="flex items-center gap-1">
                        <Activity size={10} className="text-green-500" />
                        <span className="text-xs font-black">9.2</span>
                      </div>
                    </div>
                    <div className="w-px h-6 bg-current opacity-10" />
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] uppercase tracking-widest font-black opacity-30 mb-1">Focus</span>
                      <span className="text-xs font-mono">2H 45M</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Intelligence Strip */}
              <div className="mb-12">
                 <div className={`p-6 rounded-[2.5rem] flex items-center justify-between shadow-premium transition-all relative overflow-hidden
                  ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5 shadow-black/5'}`}>
                   <div className="flex items-center gap-4 relative z-10">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${settings?.theme === 'monochrome-dark' ? 'bg-white/10' : 'bg-gray-50 border border-black/5'}`}>
                       <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                       >
                         <Target size={20} strokeWidth={1.5} className="text-green-500" />
                       </motion.div>
                     </div>
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                         <span className="text-[9px] uppercase tracking-[0.3em] font-black opacity-30">Neural Update</span>
                         <span className="w-1 h-1 rounded-full bg-green-500" />
                       </div>
                       <p className="text-[11px] font-black tracking-tight leading-tight">12% more efficient today than your average.</p>
                     </div>
                   </div>
                   <motion.div 
                    whileHover={{ x: 3 }}
                    className="relative z-10 p-2"
                   >
                    <ArrowRight size={16} className="opacity-30" />
                   </motion.div>
                   
                   {/* Background pulse */}
                   <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-500/5 blur-[40px] rounded-full pointer-events-none" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-12">
                <div className={`p-6 rounded-[2.5rem] border ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/5 shadow-2xl shadow-black/40' : 'bg-white border-black/5 shadow-premium shadow-black/[0.02]'}`}>
                  <p className="text-[8px] uppercase tracking-[0.4em] font-black opacity-30 mb-3">Core Session</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-thin tracking-tight">14</span>
                    <span className="text-[9px] uppercase font-black opacity-40 tracking-widest">Days</span>
                  </div>
                </div>
                <div className={`p-6 rounded-[2.5rem] border ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/5 shadow-2xl shadow-black/40' : 'bg-white border-black/5 shadow-premium shadow-black/[0.02]'}`}>
                  <p className="text-[8px] uppercase tracking-[0.4em] font-black opacity-30 mb-3">Neural Load</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-thin tracking-tight">1.8</span>
                    <span className="text-[9px] uppercase font-black opacity-40 tracking-widest">Hrs</span>
                  </div>
                </div>
              </div>

              {/* Main Apps - Draggable */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <Reorder.Group axis="y" values={reorderedApps} onReorder={handleReorder} className="flex-1">
                  <div className="grid grid-cols-4 gap-y-10 gap-x-2">
                    {reorderedApps.map(id => {
                      const folder = settings?.folders?.find(f => f.id === id);
                      if (folder) {
                        return (
                          <Reorder.Item key={id} value={id}>
                            <motion.div
                              onClick={() => setSelectedFolder(folder)}
                              className="flex flex-col items-center gap-3 group w-full relative h-[120px]"
                            >
                               <div className={`w-16 h-16 sm:w-20 sm:h-20 border rounded-[2rem] p-3 grid grid-cols-2 gap-1 transition-all duration-500 overflow-hidden
                                ${settings?.theme === 'monochrome-dark' ? 'bg-white/10 border-white/20' : 'bg-gray-100 border-black/10'}`}>
                                {folder.appIds.slice(0, 4).map(appId => {
                                  const Icon = (LucideIcons as any)[settings?.customIcons?.[appId] || ICON_MAP[appId] || 'Globe'];
                                  return <Icon key={appId} size={10} className="opacity-40" />;
                                })}
                              </div>
                              <div className="w-full min-h-[44px] flex items-start justify-center pt-2">
                                <span className={`text-[9px] uppercase tracking-[0.05em] font-black w-full text-center px-0.5 leading-tight break-words line-clamp-2
                                  ${settings?.theme === 'monochrome-dark' ? 'text-white/50 group-hover:text-white' : 'text-black/50 group-hover:text-black'}`}>
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
              </div>

              {/* Bottom Fixed Dock */}
              <div className={`mt-8 pt-8 border-t ${settings?.theme === 'monochrome-dark' ? 'border-white/5' : 'border-black/5'} flex justify-between items-center px-2`}>
                {[
                  { id: 'phone', label: 'Call', icon: LucideIcons.Phone },
                  { id: 'messages', label: 'Comm', icon: LucideIcons.MessageSquare },
                  { id: 'camera', label: 'Lens', icon: LucideIcons.Camera },
                  { id: 'browser', label: 'Web', icon: LucideIcons.Globe },
                ].map(dockApp => (
                  <button 
                    key={dockApp.id}
                    onClick={() => handleSystemAppClick(dockApp.id)}
                    className="flex flex-col items-center gap-3 group px-2"
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-300 ${settings?.theme === 'monochrome-dark' ? 'bg-white/5 border-white/10 group-hover:bg-white/10 group-hover:border-white/40' : 'bg-white border-black/5 shadow-sm group-hover:bg-gray-50 group-hover:border-black/20'}`}>
                      <dockApp.icon size={20} strokeWidth={1} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[9px] uppercase tracking-[0.1em] font-black opacity-40 group-hover:opacity-100 transition-opacity">{dockApp.label}</span>
                  </button>
                ))}
              </div>

            </motion.div>
          )}

          {(user || isGuest) && currentView === 'tasks' && <TaskView onBack={() => setCurrentView('home')} user={user || ({ uid: 'guest' } as any)} />}
          {(user || isGuest) && currentView === 'focus' && <FocusView onBack={() => setCurrentView('home')} user={user || ({ uid: 'guest' } as any)} settings={settings} />}
          {(user || isGuest) && currentView === 'vox' && <VoxAssistant onBack={() => setCurrentView('home')} />}
          {(user || isGuest) && currentView === 'settings' && <SettingsView onBack={() => setCurrentView('home')} user={user || ({ uid: 'guest' } as any)} settings={settings} setView={setCurrentView} createFolder={createFolder} />}
          {(user || isGuest) && currentView === 'history' && <FocusHistoryView onBack={() => setCurrentView('home')} user={user || ({ uid: 'guest' } as any)} />}
          {(user || isGuest) && currentView === 'about' && <AboutPage onBack={() => setCurrentView('settings')} />}
          {(user || isGuest) && currentView === 'app-info' && <AppInfoPage onBack={() => setCurrentView('settings')} user={user || ({ uid: 'guest' } as any)} />}
          {(user || isGuest) && currentView === 'privacy' && <PrivacyPolicyPage onBack={() => setCurrentView('settings')} />}
          {(user || isGuest) && currentView === 'guide' && <UserGuidePage onBack={() => setCurrentView('settings')} />}
          {(user || isGuest) && currentView === 'blueprint' && <BlueprintPage onBack={() => setCurrentView('settings')} />}
        </AnimatePresence>

        {(user || isGuest) && !showSplash && <BottomNav />}
      </motion.div>
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

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'tasks'), orderBy('priority', 'desc'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });
  }, [user]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      userId: user.uid,
      title: newTask,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: priority
    });
    setNewTask('');
  };

  const toggleTask = async (task: Task) => {
    const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
    await updateDoc(taskRef, { completed: !task.completed });
  };

  const deleteTask = async (id: string) => {
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

      <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide">
        {tasks.map(task => (
           <motion.div 
            layout
            key={task.id} 
            className="flex items-center gap-3 group"
          >
            <button 
              onClick={() => toggleTask(task)}
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-black border-black' : 'border-gray-300'}`}
            >
              {task.completed && <ArrowRight size={12} className="text-white" />}
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
        ))}
      </div>
    </motion.div>
  );
};

const FocusView = ({ onBack, user, settings }: { onBack: () => void, user: FirebaseUser, settings: UserSettings | null }) => {
  const [timeLeft, setTimeLeft] = useState((settings?.focusDuration || 25) * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const [coachingMessage, setCoachingMessage] = useState('Initialize your flow.');

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
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionComplete = async () => {
    await addDoc(collection(db, 'users', user.uid, 'sessions'), {
      userId: user.uid,
      startTime: new Date(Date.now() - (mode === 'work' ? (settings?.focusDuration || 25) : (settings?.breakDuration || 5)) * 60000).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: mode === 'work' ? (settings?.focusDuration || 25) : (settings?.breakDuration || 5),
      type: mode,
      completed: true
    });
    
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-between p-8 bg-black text-white overflow-hidden relative"
    >
      {/* Background Breathing Ambient */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
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
                className="absolute border border-white rounded-full"
                style={{ width: `${300 + i * 200}px`, height: `${300 + i * 200}px` }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex items-center justify-between z-10">
        <button onClick={onBack} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex bg-white/5 p-1 rounded-2xl">
           {(['work', 'break'] as const).map(m => (
             <button 
              key={m}
              onClick={() => {
                setMode(m);
                setTimeLeft((m === 'work' ? (settings?.focusDuration || 25) : (settings?.breakDuration || 5)) * 60);
                setIsActive(false);
                setCoachingMessage(m === 'work' ? 'Ready to build?' : 'Recharge and reset.');
              }}
              className={`text-[9px] uppercase tracking-[0.2em] px-5 py-2 rounded-xl transition-all font-black ${mode === m ? 'bg-white text-black font-black' : 'opacity-30'}`}
             >
               {m}
             </button>
           ))}
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="text-center space-y-12 w-full z-10 py-12">
        <div className="space-y-4">
           <div className="flex items-center gap-4 justify-center bg-white/5 px-6 py-3 rounded-full border border-white/5">
             <div className="flex flex-col items-center">
               <span className="text-[8px] uppercase tracking-widest font-black opacity-30">Blocked</span>
               <span className="text-xs font-black">42</span>
             </div>
             <div className="w-px h-6 bg-white/10" />
             <div className="flex flex-col items-center">
               <span className="text-[8px] uppercase tracking-widest font-black opacity-30">Shield</span>
               <ShieldCheck size={14} className="text-green-500" />
             </div>
             <div className="w-px h-6 bg-white/10" />
             <div className="flex flex-col items-center">
               <span className="text-[8px] uppercase tracking-widest font-black opacity-30">Status</span>
               <span className="text-xs font-black">SOVEREIGN</span>
             </div>
           </div>
           {isActive && <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="text-[9px] uppercase tracking-[0.3em] font-black text-red-500">Distraction Firewall Engaged</motion.div>}
        </div>
        
        <div className="relative inline-block">
          <h2 className="text-[11rem] md:text-[13rem] font-thin tracking-[-0.08em] leading-none select-none text-glow">
            {formatTime(timeLeft).split(':')[0]}
            <span className="opacity-20">:</span>
            {formatTime(timeLeft).split(':')[1]}
          </h2>
          <AnimatePresence mode="wait">
            <motion.p 
              key={coachingMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xs uppercase tracking-[0.3em] font-black opacity-30 mt-8 min-h-[1em]"
            >
              {coachingMessage}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full flex-col flex items-center gap-12 z-10 pb-32">
        <div className="flex items-center gap-8">
           <button 
            onClick={() => setAmbientEnabled(!ambientEnabled)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${ambientEnabled ? 'bg-white text-black border-white' : 'border-white/10 opacity-20'}`}
          >
            <Activity size={20} strokeWidth={1} />
          </button>

          <button 
            onClick={toggleTimer}
            className={`w-28 h-28 rounded-full border-2 flex items-center justify-center group transition-all duration-700 shadow-2xl ${isActive ? 'bg-white border-white scale-110 shadow-white/10' : 'bg-transparent border-white hover:bg-white/5'}`}
          >
            {!isActive ? (
               <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }}>
                <Plus size={32} strokeWidth={1} />
               </motion.div>
            ) : (
               <div className="w-6 h-6 bg-black" />
            )}
          </button>

          <button 
            onClick={resetTimer}
            className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 opacity-20 hover:opacity-100 transition-all"
          >
            <RotateCcw size={20} strokeWidth={1} />
          </button>
        </div>

        <div className="flex gap-4">
          {[15, 30, 45, 60, 90].map(mins => (
            <button 
              key={mins}
              onClick={() => {
                setTimeLeft(mins * 60);
                setIsActive(true);
                setCoachingMessage(`Setting ${mins}m block.`);
              }}
              className="text-[9px] uppercase tracking-[0.2em] px-4 py-2 border border-white/5 rounded-full hover:bg-white/10 transition-all font-black"
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const FocusHistoryView = ({ onBack, user }: { onBack: () => void, user: FirebaseUser }) => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'sessions' | 'missions'>('sessions');

  useEffect(() => {
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex-1 flex flex-col p-8 bg-black text-white h-full overflow-hidden"
    >
       <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-2xl tracking-tighter uppercase font-light">Memory Bank</h2>
      </div>

      <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
        <button 
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 py-3 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === 'sessions' ? 'bg-white text-black' : 'opacity-40'}`}
        >
          Flow Logs
        </button>
        <button 
          onClick={() => setActiveTab('missions')}
          className={`flex-1 py-3 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === 'missions' ? 'bg-white text-black' : 'opacity-40'}`}
        >
          Archive
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide pb-24">
        {activeTab === 'sessions' ? (
          <>
            {sessions.length === 0 && <p className="text-xs uppercase tracking-widest opacity-30 text-center pt-20">No flow data.</p>}
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-medium">{new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-30">
                    {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {s.type}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-thin">{s.durationMinutes}m</span>
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

const VoxAssistant = ({ onBack }: { onBack: () => void }) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex-1 flex flex-col p-8 bg-gray-50 text-black h-full"
    >
      <div className="flex items-center gap-4 mb-2">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-200 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col">
          <h2 className="text-sm font-bold tracking-widest uppercase">Vox Assistant</h2>
          <span className="text-[8px] uppercase tracking-widest opacity-40">System Active</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pt-8 space-y-8 pb-4 scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${m.role === 'user' ? 'bg-black text-white p-4 rounded-2xl rounded-tr-none' : 'text-black'}`}>
              <p className="text-sm leading-relaxed">{m.text}</p>
            </div>
          </div>
        ))}
        {isTyping && <div className="text-[10px] uppercase tracking-widest opacity-40 animate-pulse">Calculating...</div>}
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex gap-2 relative">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Query Vox..."
          className="w-full bg-white border border-gray-200 rounded-full px-6 py-4 text-sm focus:outline-none focus:border-black transition-colors shadow-sm"
        />
        <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:opacity-50 transition-opacity">
          <Send size={18} />
        </button>
      </form>
    </motion.div>
  );
};

const SettingsView = ({ onBack, user, settings, setView, createFolder }: { onBack: () => void, user: FirebaseUser, settings: UserSettings | null, setView: (v: View) => void, createFolder: (ids: string[]) => void }) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [selectedFolderApps, setSelectedFolderApps] = useState<string[]>([]);
  
  const updateSetting = async (key: string, value: any) => {
    const docRef = doc(db, 'users', user.uid, 'settings', 'global');
    await updateDoc(docRef, { [key]: value });
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
            onClick={() => auth.signOut()}
            className="text-xs uppercase tracking-widest text-red-500 hover:opacity-50 transition-opacity"
          >
            Decommission Account
          </button>
        </div>
      </div>
    </motion.div>
  );
};

