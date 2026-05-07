import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Search, Image as ImageIcon, LogOut, ExternalLink, Menu, X,
  ChevronRight, Bell, User, BarChart3, ChevronsLeft, ChevronsRight,
  Search as SearchIcon, Keyboard,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useToast } from '../context/ToastContext';
import { fetchOnlineCount } from './lib/analyticsApi';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useKeyboardShortcut, useSequenceShortcut } from '../hooks/useKeyboardShortcut';
import { useIdleTimer } from '../hooks/useIdleTimer';
import ConfirmModal from '../components/ConfirmModal';
import CommandPalette from './components/CommandPalette';
import ShortcutsHelp from './components/ShortcutsHelp';
import IdleWarningModal from './components/IdleWarningModal';
import NotificationsPanel from './components/NotificationsPanel';
import ChangePasswordModal from './components/ChangePasswordModal';
import AdminErrorBoundary from './components/AdminErrorBoundary';
import { AdminLayoutSkeleton } from './components/skeletons';

const NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Дашборд', end: true, group: 'main' as const },
  { to: '/admin/analytics', icon: BarChart3, label: 'Аналитика', end: false, group: 'main' as const },
  { to: '/admin/seo', icon: Search, label: 'SEO', end: false, group: 'content' as const },
  { to: '/admin/gallery', icon: ImageIcon, label: 'Галерея', end: false, group: 'content' as const },
];

const BREADCRUMBS: Record<string, { title: string; subtitle: string }> = {
  '/admin': { title: 'Дашборд', subtitle: 'Обзор основных показателей' },
  '/admin/analytics': { title: 'Аналитика', subtitle: 'Статистика посещений и заявок' },
  '/admin/seo': { title: 'SEO редактор', subtitle: 'Управление мета-тегами страниц' },
  '/admin/gallery': { title: 'Галерея', subtitle: 'Управление фотографиями работ' },
};

const IDLE_TIMEOUT = 60 * 60 * 1000; // 60 min
const IDLE_WARN_BEFORE = 60 * 1000; // 60 sec warning

export default function AdminLayout() {
  const { logout, dbReady, notifications, userEmail } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useLocalStorage('admin_sidebar_collapsed', false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);

  const breadcrumb = BREADCRUMBS[location.pathname] || { title: 'Админка', subtitle: '' };

  // Online users (sessions seen in last 5 minutes — RPC returns count via SECURITY DEFINER)
  const [onlineCount, setOnlineCount] = useState<number>(0);
  useEffect(() => {
    let cancelled = false;
    const tick = () => fetchOnlineCount().then((n) => { if (!cancelled) setOnlineCount(n); });
    tick();
    const interval = setInterval(tick, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // Close popovers on route change
  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  // Lock scroll when mobile sidebar open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // ============== Idle Timer ==============
  const { warning, extend } = useIdleTimer({
    timeout: IDLE_TIMEOUT,
    warningBefore: IDLE_WARN_BEFORE,
    onTimeout: () => {
      logout();
      navigate('/admin/login');
      toast.info('Сессия истекла', 'Вы были выйдены из-за бездействия');
    },
  });

  // ============== Shortcuts ==============
  useKeyboardShortcut({ key: 'k', modifiers: ['cmd'] }, () => setCmdkOpen(true), []);
  useKeyboardShortcut({ key: '?', modifiers: ['shift'] }, () => setShortcutsOpen(true), []);
  useKeyboardShortcut({ key: '/' }, () => {
    const el = document.querySelector<HTMLInputElement>('[data-page-search]');
    if (el) {
      el.focus();
      el.select();
    } else {
      setCmdkOpen(true);
    }
  }, []);
  useSequenceShortcut(['g', 'd'], () => navigate('/admin'), {}, [navigate]);
  useSequenceShortcut(['g', 'a'], () => navigate('/admin/analytics'), {}, [navigate]);
  useSequenceShortcut(['g', 's'], () => navigate('/admin/seo'), {}, [navigate]);
  useSequenceShortcut(['g', 'g'], () => navigate('/admin/gallery'), {}, [navigate]);
  useKeyboardShortcut({ key: 'n' }, () => {
    if (location.pathname === '/admin/gallery') {
      window.dispatchEvent(new CustomEvent('admin:add-photo'));
    } else {
      navigate('/admin/gallery');
      setTimeout(() => window.dispatchEvent(new CustomEvent('admin:add-photo')), 100);
    }
  }, [location.pathname, navigate]);

  // ============== Render ==============
  if (!dbReady) return <AdminLayoutSkeleton />;

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const initial = (userEmail?.[0] || 'A').toUpperCase();
  const displayName = userEmail?.split('@')[0] || 'admin';

  const sidebarWidth = collapsed ? 'w-[68px]' : 'w-72';

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen ${sidebarWidth} bg-dark-800 border-r border-white/5 flex flex-col transition-[transform,width] duration-200 ${
          sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className={`p-4 border-b border-white/5 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/admin" className="flex items-center gap-3 group min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-soft flex-shrink-0">
              <span className="text-white font-bold leading-none">P</span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-display font-bold text-white text-lg leading-tight truncate">
                  Potolki<span className="text-primary-400">.md</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-subtle">Admin Panel</div>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {(['main', 'content'] as const).map((group) => (
            <div key={group}>
              {!collapsed && (
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-faint font-medium">
                  {group === 'main' ? 'Главное' : 'Контент'}
                </div>
              )}
              {NAV_ITEMS.filter((i) => i.group === group).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-2.5 my-0.5 rounded-xl text-sm font-medium transition-all relative ${
                      isActive
                        ? 'bg-primary-600/20 text-primary-300'
                        : 'text-body hover:bg-white/[0.04] hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-400 rounded-r-full" />}
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
              {group === 'main' && <div className="h-2" />}
            </div>
          ))}
        </nav>

        {/* Status / collapse toggle */}
        <div className="p-3 border-t border-white/5 space-y-2">
          {!collapsed && (
            <div className="px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-green-300 text-xs font-medium truncate">
                Онлайн: {onlineCount}
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Развернуть' : 'Свернуть'}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-subtle hover:text-white hover:bg-white/[0.04] transition-colors text-xs"
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : (<><ChevronsLeft className="w-4 h-4" /><span>Свернуть</span></>)}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-x-hidden flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-dark-900/95 border-b border-white/5">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-white flex-shrink-0"
                aria-label="Открыть меню"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-subtle mb-0.5">
                  <span>Админка</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-muted">{breadcrumb.title}</span>
                </div>
                <h2 className="text-white font-semibold text-base sm:text-lg truncate">
                  {breadcrumb.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Search trigger (Cmd+K) */}
              <button
                onClick={() => setCmdkOpen(true)}
                className="hidden md:inline-flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-subtle hover:text-white text-sm transition-colors min-w-[220px]"
                aria-label="Поиск"
              >
                <SearchIcon className="w-4 h-4" />
                <span className="flex-1 text-left">Поиск...</span>
                <kbd className="text-[10px] border border-white/10 bg-dark-900/50 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
              </button>
              <button
                onClick={() => setCmdkOpen(true)}
                className="md:hidden w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-white"
                aria-label="Поиск"
              >
                <SearchIcon className="w-4 h-4" />
              </button>

              {/* View site */}
              <Link
                to="/"
                target="_blank"
                title="Открыть сайт"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-body hover:text-white text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-body hover:text-white transition-colors"
                  aria-label={`Уведомления (${unreadCount} непрочитанных)`}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-dark-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
              </div>

              {/* Shortcuts hint button */}
              <button
                onClick={() => setShortcutsOpen(true)}
                title="Горячие клавиши"
                className="hidden lg:flex w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 items-center justify-center text-body hover:text-white transition-colors"
                aria-label="Горячие клавиши"
              >
                <Keyboard className="w-4 h-4" />
              </button>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
                  aria-label="Профиль"
                  aria-haspopup="menu"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold text-sm">
                    {initial}
                  </div>
                  <span className="hidden sm:inline text-body text-sm font-medium">{displayName}</span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        role="menu"
                        className="absolute right-0 top-full mt-2 w-60 bg-dark-800 border border-white/10 rounded-xl overflow-hidden shadow-soft-lg z-40"
                      >
                        <div className="p-3 border-b border-white/5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white text-sm font-medium truncate">Администратор</div>
                            <div className="text-subtle text-xs truncate">{userEmail || '—'}</div>
                          </div>
                        </div>
                        <div className="p-1">
                          <button
                            onClick={() => { setProfileOpen(false); setChangePassOpen(true); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-body hover:bg-white/[0.04] hover:text-white transition-colors"
                            role="menuitem"
                          >
                            <User className="w-4 h-4" />
                            Сменить пароль
                          </button>
                          <button
                            onClick={() => { setProfileOpen(false); setShortcutsOpen(true); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-body hover:bg-white/[0.04] hover:text-white transition-colors"
                            role="menuitem"
                          >
                            <Keyboard className="w-4 h-4" />
                            Горячие клавиши
                          </button>
                          <button
                            onClick={() => { setProfileOpen(false); setConfirmLogout(true); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-red-500/10 transition-colors"
                            role="menuitem"
                          >
                            <LogOut className="w-4 h-4" />
                            Выйти
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <AdminErrorBoundary>
            <Outlet />
          </AdminErrorBoundary>
        </div>
      </main>

      {/* Modals */}
      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} />
      <ShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ChangePasswordModal open={changePassOpen} onClose={() => setChangePassOpen(false)} />
      <IdleWarningModal
        open={warning}
        totalSeconds={Math.floor(IDLE_WARN_BEFORE / 1000)}
        onExtend={extend}
        onLogout={handleLogout}
      />

      <ConfirmModal
        open={confirmLogout}
        title="Выйти из админки?"
        description="Вам потребуется снова ввести логин и пароль для входа."
        confirmText="Выйти"
        variant="warning"
        icon={<LogOut className="w-5 h-5 text-amber-400" />}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
