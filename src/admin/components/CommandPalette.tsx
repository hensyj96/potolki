import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, BarChart3, Image as ImageIcon, Search as SearchIcon,
  Plus, LogOut, Download, ExternalLink, RefreshCw, ArrowRight, Hash, FileSearch,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { buildSitemap, buildRobotsTxt, downloadFile } from '../lib/sitemap';

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  group: 'Навигация' | 'Действия' | 'Галерея' | 'SEO' | 'Утилиты';
  icon: LucideIcon;
  shortcut?: string;
  perform: () => void | Promise<void>;
  keywords?: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { gallery, seoConfig, logout } = useAdmin();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 80);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build commands
  const commands = useMemo<Cmd[]>(() => {
    const base: Cmd[] = [
      { id: 'go-dash', label: 'Дашборд', hint: 'Главный экран', group: 'Навигация', icon: LayoutDashboard, shortcut: 'g d',
        perform: () => navigate('/admin') },
      { id: 'go-an', label: 'Аналитика', hint: 'Статистика и графики', group: 'Навигация', icon: BarChart3, shortcut: 'g a',
        perform: () => navigate('/admin/analytics') },
      { id: 'go-seo', label: 'SEO редактор', hint: 'Мета-теги страниц', group: 'Навигация', icon: SearchIcon, shortcut: 'g s',
        perform: () => navigate('/admin/seo') },
      { id: 'go-gal', label: 'Галерея', hint: 'Управление фотографиями', group: 'Навигация', icon: ImageIcon, shortcut: 'g g',
        perform: () => navigate('/admin/gallery') },
      { id: 'go-site', label: 'Открыть сайт', hint: 'Публичная версия', group: 'Навигация', icon: ExternalLink,
        perform: () => { window.open('/', '_blank'); } },

      { id: 'add-photo', label: 'Добавить фото', hint: 'Перейти к загрузке', group: 'Действия', icon: Plus, shortcut: 'n',
        perform: () => { navigate('/admin/gallery'); window.dispatchEvent(new CustomEvent('admin:add-photo')); } },
      { id: 'export-sitemap', label: 'Скачать sitemap.xml', group: 'Утилиты', icon: Download,
        perform: () => downloadFile(buildSitemap(), 'sitemap.xml', 'application/xml') },
      { id: 'export-robots', label: 'Скачать robots.txt', group: 'Утилиты', icon: Download,
        perform: () => downloadFile(buildRobotsTxt(), 'robots.txt', 'text/plain') },
      { id: 'reload', label: 'Перезагрузить админку', group: 'Утилиты', icon: RefreshCw,
        perform: () => window.location.reload() },
      { id: 'logout', label: 'Выйти из админки', group: 'Действия', icon: LogOut,
        perform: () => { logout(); navigate('/admin/login'); } },
    ];

    // Gallery items
    gallery.slice(0, 50).forEach((item) => {
      base.push({
        id: `gal-${item.id}`, label: item.title, hint: item.type, group: 'Галерея', icon: ImageIcon,
        keywords: [item.titleRo || '', item.room],
        perform: () => { navigate('/admin/gallery'); window.dispatchEvent(new CustomEvent('admin:edit-photo', { detail: { id: item.id } })); },
      });
    });

    // SEO entries
    Object.entries(seoConfig).forEach(([path, langs]) => {
      (['ru', 'ro'] as const).forEach((lang) => {
        const data = langs[lang];
        if (!data?.title) return;
        base.push({
          id: `seo-${path}-${lang}`,
          label: `SEO: ${path} (${lang.toUpperCase()})`,
          hint: data.title,
          group: 'SEO', icon: FileSearch,
          keywords: [data.description?.slice(0, 60) || ''],
          perform: () => navigate(`/admin/seo?path=${encodeURIComponent(path)}&lang=${lang}`),
        });
      });
    });

    return base;
  }, [navigate, logout, gallery, seoConfig]);

  const fuse = useMemo(() =>
    new Fuse(commands, {
      keys: [
        { name: 'label', weight: 0.6 },
        { name: 'hint', weight: 0.2 },
        { name: 'keywords', weight: 0.2 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    }), [commands]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return commands;
    return fuse.search(q).map((r) => r.item);
  }, [debouncedQuery, fuse, commands]);

  // Group filtered by group
  const groups = useMemo(() => {
    const map = new Map<string, Cmd[]>();
    filtered.forEach((c) => {
      const g = map.get(c.group) || [];
      g.push(c);
      map.set(c.group, g);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [debouncedQuery]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filtered[activeIdx];
        if (cmd) {
          onClose();
          Promise.resolve(cmd.perform()).catch(console.error);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, filtered, activeIdx]);

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-cmd-idx="${activeIdx}"]`);
    if (el && 'scrollIntoView' in el) {
      (el as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-[180] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Командная палитра"
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' as const }}
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-xl shadow-soft-lg overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <Search className="w-4 h-4 text-faint flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по командам, фото, SEO..."
                className="flex-1 bg-transparent text-white placeholder-faint outline-none text-sm"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden sm:inline-flex text-[10px] text-faint border border-white/10 rounded-md px-1.5 py-0.5 font-mono">ESC</kbd>
            </div>

            <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-subtle text-sm">Ничего не найдено</div>
              ) : (
                groups.map(([group, items]) => (
                  <div key={group} className="mb-1">
                    <div className="px-4 py-1 text-[10px] uppercase tracking-wider text-faint font-medium">{group}</div>
                    {items.map((cmd) => {
                      const idx = filtered.indexOf(cmd);
                      const isActive = idx === activeIdx;
                      return (
                        <button
                          key={cmd.id}
                          data-cmd-idx={idx}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={() => { onClose(); Promise.resolve(cmd.perform()).catch(console.error); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isActive ? 'bg-primary-600/20 text-white' : 'text-body hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isActive ? 'bg-primary-600/30 text-primary-200' : 'bg-white/[0.04] text-muted'
                          }`}>
                            <cmd.icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm truncate">{cmd.label}</div>
                            {cmd.hint && <div className="text-xs text-subtle truncate">{cmd.hint}</div>}
                          </div>
                          {cmd.shortcut && (
                            <kbd className="text-[10px] text-faint border border-white/10 rounded px-1.5 py-0.5 font-mono flex-shrink-0">
                              {cmd.shortcut}
                            </kbd>
                          )}
                          <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 transition-opacity ${isActive ? 'opacity-100 text-primary-300' : 'opacity-0'}`} />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between text-[10px] text-faint">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{filtered.length}</span>
                <span>↑↓ навигация</span>
                <span>↵ выбрать</span>
              </div>
              <span>ESC закрыть</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
