import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Save, RotateCcw, AlertCircle, Check, FileText, Tag, Globe, Copy, ExternalLink,
  Image as ImageIcon, History, Download, ChevronRight, ArrowLeftRight,
  Eye, ShieldAlert,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import type { SeoData } from '../../db/database';
import ConfirmModal from '../../components/ConfirmModal';
import SeoDiffModal from '../components/SeoDiffModal';
import SeoHistoryModal from '../components/SeoHistoryModal';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useDirtyGuard } from '../../hooks/useDirtyGuard';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { buildSitemap, buildRobotsTxt, downloadFile } from '../lib/sitemap';

const PAGES = [
  { path: '/', label: 'Главная', icon: '🏠' },
  { path: '/services', label: 'Услуги', icon: '🛠️' },
  { path: '/gallery', label: 'Галерея', icon: '🖼️' },
  { path: '/prices', label: 'Цены', icon: '💰' },
  { path: '/about', label: 'О нас', icon: '👥' },
  { path: '/contact', label: 'Контакты', icon: '📞' },
];

const TITLE_LIMITS = { warn: 60, max: 70 };
const DESC_LIMITS = { min: 120, ideal: 155, max: 160 };

const EMPTY_DATA: SeoData = { title: '', description: '' };

function getCharColor(len: number, min: number, max: number) {
  if (len === 0) return 'text-faint';
  if (len < min) return 'text-amber-300';
  if (len > max) return 'text-red-300';
  return 'text-green-300';
}

function getCharProgress(len: number, max: number) {
  return Math.min((len / max) * 100, 100);
}

export default function SeoEditor() {
  const { seoConfig, updateSeo, resetSeo, resetSeoForPage, dbReady } = useAdmin();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialPath = searchParams.get('path') || '/';
  const initialLang = (searchParams.get('lang') === 'ro' ? 'ro' : 'ru') as 'ru' | 'ro';

  const [selectedPath, setSelectedPath] = useState(initialPath);
  const [selectedLang, setSelectedLang] = useState<'ru' | 'ro'>(initialLang);
  const [draft, setDraft] = useState<SeoData>(EMPTY_DATA);
  const [savedSnapshot, setSavedSnapshot] = useState<SeoData>(EMPTY_DATA);
  const [showResetAll, setShowResetAll] = useState(false);
  const [showResetPage, setShowResetPage] = useState(false);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [copyFromLang, setCopyFromLang] = useState<'ru' | 'ro' | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [autosaveBanner, setAutosaveBanner] = useState(false);
  const initialized = useRef(false);

  const draftKey = `seo_draft:${selectedPath}:${selectedLang}`;
  const [persistedDraft, setPersistedDraft, removePersistedDraft] = useLocalStorage<SeoData | null>(draftKey, null);
  const debouncedDraft = useDebouncedValue(draft, 600);

  // Sync URL params
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (selectedPath !== '/') next.set('path', selectedPath); else next.delete('path');
    if (selectedLang !== 'ru') next.set('lang', selectedLang); else next.delete('lang');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, selectedLang]);

  // Load active record into draft
  useEffect(() => {
    if (!dbReady) return;
    const persisted = seoConfig[selectedPath]?.[selectedLang] || EMPTY_DATA;
    setSavedSnapshot(persisted);
    // If there's an unsaved draft and it differs — show banner
    if (persistedDraft && JSON.stringify(persistedDraft) !== JSON.stringify(persisted)) {
      setDraft(persisted);
      setAutosaveBanner(true);
    } else {
      setDraft(persisted);
      setAutosaveBanner(false);
    }
    initialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, selectedLang, seoConfig, dbReady]);

  // Autosave to localStorage when dirty
  useEffect(() => {
    if (!initialized.current) return;
    const isDirty = JSON.stringify(debouncedDraft) !== JSON.stringify(savedSnapshot);
    if (isDirty) {
      setPersistedDraft(debouncedDraft);
    } else {
      removePersistedDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDraft, savedSnapshot]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedSnapshot),
    [draft, savedSnapshot]
  );

  // Router-level dirty guard for tab navigation
  const blocker = useDirtyGuard(isDirty, 'У вас есть несохранённые изменения');

  useEffect(() => {
    if (blocker?.state === 'blocked') {
      const ok = window.confirm('У вас есть несохранённые изменения. Выйти без сохранения?');
      if (ok) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);

  // Keyboard shortcuts
  useKeyboardShortcut({ key: 's', modifiers: ['cmd'] }, () => {
    if (isDirty) handleSave();
  }, [isDirty, draft]);
  useKeyboardShortcut({ key: 'z', modifiers: ['cmd'] }, () => {
    if (isDirty) {
      setDraft(savedSnapshot);
      removePersistedDraft();
      toast.info('Откат', 'Изменения отменены');
    }
  }, [isDirty, savedSnapshot]);

  const handleSave = async () => {
    if (!isDirty) return;
    setShowDiff(true);
  };

  const confirmSave = async () => {
    await updateSeo(selectedPath, selectedLang, draft);
    setSavedSnapshot(draft);
    removePersistedDraft();
    setAutosaveBanner(false);
    setShowDiff(false);
    toast.success('Сохранено', `${selectedPath} (${selectedLang.toUpperCase()})`);
  };

  const handleReset = () => {
    setDraft(savedSnapshot);
    removePersistedDraft();
    setAutosaveBanner(false);
    toast.info('Сброшено', 'Поля приведены к сохранённой версии');
  };

  const handleResetAll = async () => {
    try {
      await resetSeo();
      setShowResetAll(false);
      removePersistedDraft();
      setAutosaveBanner(false);
      toast.success('Сброшено', 'Все мета-теги возвращены к значениям по умолчанию');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка сброса', 'Не удалось сбросить мета-теги. Проверьте права admin в Supabase.');
    }
  };

  const handleResetPage = async () => {
    try {
      await resetSeoForPage(selectedPath, selectedLang);
      setShowResetPage(false);
      removePersistedDraft();
      setAutosaveBanner(false);
      toast.success('Сброшено', `${selectedPath} (${selectedLang.toUpperCase()})`);
    } catch (err) {
      console.error(err);
      toast.error('Ошибка сброса', 'Не удалось сбросить страницу. Проверьте права admin в Supabase.');
    }
  };

  const handleCopyFromOther = () => {
    const other = selectedLang === 'ru' ? 'ro' : 'ru';
    if (isDirty) {
      setCopyFromLang(other);
      setShowCopyConfirm(true);
    } else {
      doCopyFromLang(other);
    }
  };

  const doCopyFromLang = (from: 'ru' | 'ro') => {
    const otherData = seoConfig[selectedPath]?.[from];
    if (otherData) {
      setDraft(otherData);
      toast.info('Скопировано', `Из ${from.toUpperCase()}-версии`);
    }
    setShowCopyConfirm(false);
  };

  const restoreDraft = () => {
    if (persistedDraft) setDraft(persistedDraft);
    setAutosaveBanner(false);
  };

  const discardDraft = () => {
    removePersistedDraft();
    setAutosaveBanner(false);
  };

  // Duplicate description detection across pages (same lang)
  const dupWarnings = useMemo(() => {
    const dups: { path: string; description: string }[] = [];
    const desc = (draft.description || '').trim();
    if (desc.length > 0) {
      Object.entries(seoConfig).forEach(([path, langs]) => {
        if (path === selectedPath) return;
        if (langs[selectedLang]?.description?.trim() === desc) {
          dups.push({ path, description: desc });
        }
      });
    }
    return dups;
  }, [draft.description, seoConfig, selectedPath, selectedLang]);

  const renderField = (
    label: string,
    field: keyof SeoData,
    type: 'text' | 'textarea',
    icon: React.ReactNode,
    placeholder: string,
    limits?: { warn: number; max: number; min?: number; ideal?: number }
  ) => {
    const value = (draft[field] as string) || '';
    const length = value.length;

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-muted text-sm font-medium">
            {icon}
            {label}
            {limits && (
              <span className="text-faint text-xs font-normal">
                · идеально {limits.ideal || limits.warn}-{limits.max}
              </span>
            )}
          </label>
          {limits && length > 0 && (
            <span className={`text-xs font-mono ${getCharColor(length, limits.min || 0, limits.max)}`}>
              {length} / {limits.max}
            </span>
          )}
        </div>
        {type === 'text' ? (
          <input
            type="text"
            value={value}
            onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
            placeholder={placeholder}
            className="input-field text-sm"
          />
        ) : (
          <textarea
            value={value}
            onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
            placeholder={placeholder}
            rows={3}
            className="input-field text-sm resize-y leading-relaxed"
          />
        )}
        {limits && (
          <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                length > limits.max
                  ? 'bg-red-400'
                  : length > limits.warn
                  ? 'bg-amber-400'
                  : 'bg-green-400'
              }`}
              style={{ width: `${getCharProgress(length, limits.max)}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-muted text-sm">
          {Object.keys(seoConfig).length} страниц настроены
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => downloadFile(buildSitemap(), 'sitemap.xml', 'application/xml')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-body hover:text-white text-sm transition-colors"
            title="Скачать sitemap.xml"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">sitemap.xml</span>
          </button>
          <button
            onClick={() => downloadFile(buildRobotsTxt(), 'robots.txt', 'text/plain')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-body hover:text-white text-sm transition-colors"
            title="Скачать robots.txt"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">robots.txt</span>
          </button>
          <button
            onClick={() => setShowResetAll(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Сбросить всё</span>
            <span className="sm:hidden">Сброс</span>
          </button>
        </div>
      </div>

      {/* Autosave restore banner */}
      {autosaveBanner && persistedDraft && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-amber-300 text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Найден несохранённый черновик для этой страницы</span>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <button onClick={discardDraft} className="text-xs text-subtle hover:text-white px-3 py-1.5 rounded-md transition-colors">
              Отбросить
            </button>
            <button onClick={restoreDraft} className="text-xs text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1.5 rounded-md font-medium transition-colors">
              Восстановить
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          <div className="card rounded-2xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-faint font-medium px-2 py-1.5 mb-1">
              Страницы
            </div>
            {PAGES.map((page) => {
              const ruEmpty = !seoConfig[page.path]?.ru.title;
              const roEmpty = !seoConfig[page.path]?.ro.title;
              const isActive = selectedPath === page.path;
              return (
                <button
                  key={page.path}
                  onClick={() => setSelectedPath(page.path)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all text-left text-sm ${
                    isActive ? 'bg-primary-600/20 text-primary-200' : 'text-body hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">{page.icon}</span>
                    <span className="truncate">{page.label}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {ruEmpty && <span title="RU не заполнен" className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    {roEmpty && <span title="RO не заполнен" className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                    {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="card rounded-2xl p-3 hidden lg:block">
            <div className="text-[10px] uppercase tracking-wider text-faint font-medium px-2 py-1.5 mb-1">
              Подсказки
            </div>
            <ul className="text-xs text-muted space-y-1.5 px-2 leading-relaxed">
              <li>• Title: до 60 знаков</li>
              <li>• Description: 120–160</li>
              <li>• OG-картинка 1200×630</li>
              <li>• Уникальные мета на странице</li>
            </ul>
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {/* Lang switch + actions */}
          <div className="card rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-xl p-0.5 flex-shrink-0">
              {(['ru', 'ro'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    selectedLang === lang
                      ? 'bg-primary-600 text-white shadow-soft'
                      : 'text-body hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyFromOther}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-body hover:text-white transition-colors"
              title={`Копировать из ${selectedLang === 'ru' ? 'RO' : 'RU'}`}
            >
              <Copy className="w-3.5 h-3.5" />
              Из {selectedLang === 'ru' ? 'RO' : 'RU'}
            </button>

            <button
              onClick={() => setShowHistory(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-body hover:text-white transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              История
            </button>

            <button
              onClick={() => setShowResetPage(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Сброс
            </button>

            <div className="flex-1 hidden sm:flex items-center justify-end gap-2 text-xs">
              {isDirty ? (
                <span className="text-amber-300 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Не сохранено
                </span>
              ) : (
                <span className="text-green-300 inline-flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Сохранено
                </span>
              )}
            </div>
          </div>

          {/* Form */}
          <motion.div
            key={`${selectedPath}:${selectedLang}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="card rounded-2xl p-5 sm:p-6 space-y-5"
          >
            {renderField('Title', 'title', 'text', <Tag className="w-4 h-4 text-primary-300" />,
              'Заголовок для поисковиков...', { warn: TITLE_LIMITS.warn, max: TITLE_LIMITS.max, min: 30, ideal: 50 })}

            {renderField('Description', 'description', 'textarea', <FileText className="w-4 h-4 text-primary-300" />,
              'Описание для сниппета в выдаче...',
              { warn: DESC_LIMITS.ideal, max: DESC_LIMITS.max, min: DESC_LIMITS.min, ideal: DESC_LIMITS.ideal })}

            {dupWarnings.length > 0 && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/25 p-3">
                <div className="flex items-start gap-2 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">Description дублируется</div>
                    <div className="text-red-200/80">
                      Совпадает со страницами: {dupWarnings.map((d) => d.path).join(', ')}.
                      Поисковики могут показывать свой текст вместо вашего.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-white/5 pt-5 space-y-4">
              <div className="text-xs text-faint font-medium uppercase tracking-wider">
                Open Graph (соцсети)
              </div>

              {renderField('OG Title', 'ogTitle', 'text', <Tag className="w-4 h-4 text-primary-300" />,
                'Заголовок для шаринга (по умолчанию = Title)')}

              {renderField('OG Description', 'ogDescription', 'textarea', <FileText className="w-4 h-4 text-primary-300" />,
                'Описание для соцсетей')}

              {renderField('OG Image', 'ogImage', 'text', <ImageIcon className="w-4 h-4 text-primary-300" />,
                'https://example.com/preview.jpg (1200×630)')}
            </div>
          </motion.div>

          {/* Live preview: Google + Open Graph */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-primary-300" />
                <span className="text-white font-semibold text-sm">Превью в Google</span>
              </div>
              <div className="rounded-xl bg-white p-4 max-w-md">
                <div className="text-xs text-gray-500 truncate mb-1">potolki.md{selectedPath}</div>
                <div className="text-blue-700 font-medium hover:underline cursor-pointer mb-1 line-clamp-1">
                  {draft.title || 'Заголовок страницы'}
                </div>
                <div className="text-sm text-gray-700 line-clamp-2">
                  {draft.description || 'Описание появится здесь...'}
                </div>
              </div>
            </div>

            <div className="card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowLeftRight className="w-4 h-4 text-primary-300" />
                <span className="text-white font-semibold text-sm">Превью OG (Facebook / WA)</span>
              </div>
              <div className="rounded-xl border border-white/10 overflow-hidden bg-dark-900 max-w-md">
                <div className="aspect-[1.91/1] bg-white/5 relative overflow-hidden flex items-center justify-center">
                  {draft.ogImage ? (
                    <img src={draft.ogImage} alt="OG" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-faint text-xs flex flex-col items-center gap-1">
                      <ImageIcon className="w-6 h-6" />
                      Нет OG изображения
                    </div>
                  )}
                </div>
                <div className="p-3 bg-dark-800">
                  <div className="text-[10px] text-faint uppercase mb-1">potolki.md</div>
                  <div className="text-white font-medium text-sm line-clamp-1 mb-0.5">
                    {draft.ogTitle || draft.title || 'OG Title'}
                  </div>
                  <div className="text-subtle text-xs line-clamp-2">
                    {draft.ogDescription || draft.description || 'OG Description'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save bar */}
          <div className="card rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center sm:items-stretch">
            <a
              href={selectedPath}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-body hover:text-white text-sm transition-colors w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4" />
              Открыть страницу
            </a>
            <button
              onClick={handleReset}
              disabled={!isDirty}
              className="btn-secondary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Откатить
              <kbd className="hidden sm:inline-flex text-[10px] border border-white/15 rounded px-1 ml-1 font-mono opacity-70">⌘Z</kbd>
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Сохранить
              <kbd className="hidden sm:inline-flex text-[10px] border border-white/20 rounded px-1 ml-1 font-mono opacity-70">⌘S</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SeoDiffModal
        open={showDiff}
        before={savedSnapshot}
        after={draft}
        onConfirm={confirmSave}
        onCancel={() => setShowDiff(false)}
      />

      <SeoHistoryModal
        open={showHistory}
        path={selectedPath}
        lang={selectedLang}
        onClose={() => setShowHistory(false)}
        onRollback={(data) => {
          setDraft(data);
          toast.info('Откат загружен', 'Нажмите «Сохранить», чтобы применить');
        }}
      />

      <ConfirmModal
        open={showCopyConfirm}
        title="Перезаписать черновик?"
        description={`У вас несохранённые изменения. Они будут заменены данными из ${copyFromLang?.toUpperCase()}-версии.`}
        confirmText="Перезаписать"
        variant="warning"
        onConfirm={() => copyFromLang && doCopyFromLang(copyFromLang)}
        onCancel={() => setShowCopyConfirm(false)}
      />

      <ConfirmModal
        open={showResetAll}
        title="Сбросить все мета-теги?"
        description="Все мета-теги для всех страниц вернутся к значениям по умолчанию. Это действие нельзя отменить."
        confirmText="Сбросить всё"
        variant="danger"
        requireType="RESET"
        onConfirm={handleResetAll}
        onCancel={() => setShowResetAll(false)}
      />

      <ConfirmModal
        open={showResetPage}
        title="Сбросить эту страницу?"
        description={`Мета-теги для ${selectedPath} (${selectedLang.toUpperCase()}) вернутся к значениям по умолчанию.`}
        confirmText="Сбросить"
        variant="warning"
        onConfirm={handleResetPage}
        onCancel={() => setShowResetPage(false)}
      />
    </div>
  );
}
