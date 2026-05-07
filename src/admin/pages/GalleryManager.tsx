import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, X, Upload, Image as ImageIcon, Search, Save,
  Grid3x3, List, CheckSquare, Square, Calendar, ArrowUpDown, GripVertical,
  Loader2, AlertCircle,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import type { GalleryItem } from '../../db/database';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';
import GalleryThumb from '../components/GalleryThumb';
import InlineEdit from '../components/InlineEdit';
import { optimizeAndStore } from '../lib/imageStore';
import { pushUndo, consumeUndo } from '../lib/undoQueue';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

const ROOM_OPTIONS: { value: GalleryItem['room']; label: string; emoji: string }[] = [
  { value: 'living', label: 'Залы', emoji: '🛋️' },
  { value: 'kitchen', label: 'Кухни', emoji: '🍳' },
  { value: 'bedroom', label: 'Спальни', emoji: '🛏️' },
  { value: 'bathroom', label: 'Санузлы', emoji: '🛁' },
  { value: 'office', label: 'Офисы', emoji: '💼' },
];

const ROOM_BADGE_COLORS: Record<string, string> = {
  living: 'bg-primary-600/85',
  kitchen: 'bg-purple-600/85',
  bedroom: 'bg-pink-600/85',
  bathroom: 'bg-cyan-600/85',
  office: 'bg-amber-600/85',
};

type SortKey = 'order_asc' | 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'category';
type ViewMode = 'grid' | 'list';

type FormState = {
  src: string;
  thumbSrc?: string;
  title: string;
  titleRo: string;
  type: string;
  typeRo: string;
  room: GalleryItem['room'];
  meta?: { width: number; height: number; size: number };
};

const EMPTY_FORM: FormState = {
  src: '', title: '', titleRo: '', type: '', typeRo: '', room: 'living',
};

function isUrlOrBlob(s: string): boolean {
  if (!s) return false;
  if (s.startsWith('blob:')) return true;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function GalleryManager() {
  const { gallery, addGalleryItem, addGalleryItemRaw, updateGalleryItem, deleteGalleryItem, reorderGallery } = useAdmin();
  const toast = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [originalForm, setOriginalForm] = useState<FormState>(EMPTY_FORM);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmCloseForm, setConfirmCloseForm] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortKey, setSortKey] = useState<SortKey>('order_asc');
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  // Bulk upload
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<{ src: string; name: string; file: File }[]>([]);
  const [bulkRoom, setBulkRoom] = useState<GalleryItem['room']>('living');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form dirty tracking
  const isFormDirty = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(originalForm);
  }, [form, originalForm]);

  // Browser-level dirty guard for the modal
  useEffect(() => {
    if (!showForm || !isFormDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [showForm, isFormDirty]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let result = gallery.filter((item) => {
      const matchRoom = filter === 'all' || item.room === filter;
      if (!search) return matchRoom;
      const q = search.toLowerCase();
      const matchSearch =
        item.title.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.titleRo?.toLowerCase().includes(q) ?? false);
      return matchRoom && matchSearch;
    });

    switch (sortKey) {
      case 'order_asc':
        result = [...result].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        break;
      case 'date_desc': result = [...result].sort((a, b) => b.createdAt - a.createdAt); break;
      case 'date_asc': result = [...result].sort((a, b) => a.createdAt - b.createdAt); break;
      case 'name_asc': result = [...result].sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'name_desc': result = [...result].sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'category': result = [...result].sort((a, b) => a.room.localeCompare(b.room)); break;
    }
    return result;
  }, [gallery, filter, search, sortKey]);

  const isAllSelected = filtered.length > 0 && filtered.every((item) => selected.has(item.id));
  const dndEnabled = sortKey === 'order_asc' && !search && filter === 'all';

  const openAdd = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOriginalForm(EMPTY_FORM);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((item: GalleryItem) => {
    setEditingId(item.id);
    const next: FormState = {
      src: item.src,
      thumbSrc: item.thumbSrc,
      title: item.title,
      titleRo: item.titleRo || '',
      type: item.type,
      typeRo: item.typeRo || '',
      room: item.room,
    };
    setForm(next);
    setOriginalForm(next);
    setShowForm(true);
  }, []);

  // External triggers from Cmd+K / shortcut
  useEffect(() => {
    const onAdd = () => openAdd();
    const onEdit = (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      const item = gallery.find((g) => g.id === id);
      if (item) openEdit(item);
    };
    window.addEventListener('admin:add-photo', onAdd);
    window.addEventListener('admin:edit-photo', onEdit as EventListener);
    return () => {
      window.removeEventListener('admin:add-photo', onAdd);
      window.removeEventListener('admin:edit-photo', onEdit as EventListener);
    };
  }, [gallery, openAdd, openEdit]);

  // Page-level shortcut: '/' to focus search; 'n' is global already
  useKeyboardShortcut({ key: 's', modifiers: ['cmd'] }, () => {
    if (showForm) handleSubmit();
  }, [showForm, form, originalForm]);

  const closeForm = useCallback(() => {
    if (isFormDirty) {
      setConfirmCloseForm(true);
      return;
    }
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOriginalForm(EMPTY_FORM);
  }, [isFormDirty]);

  const forceCloseForm = () => {
    setConfirmCloseForm(false);
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOriginalForm(EMPTY_FORM);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.src || !isUrlOrBlob(form.src)) {
      toast.error('Не удалось сохранить', 'Загрузите изображение или укажите корректный URL');
      return;
    }
    if (form.title.trim().length < 2) {
      toast.error('Слишком короткое название', 'Минимум 2 символа');
      return;
    }
    if (editingId) {
      await updateGalleryItem(editingId, {
        src: form.src,
        thumbSrc: form.thumbSrc,
        title: form.title.trim(),
        titleRo: form.titleRo.trim(),
        type: form.type.trim(),
        typeRo: form.typeRo.trim(),
        room: form.room,
      });
      toast.success('Сохранено', 'Фото обновлено');
    } else {
      await addGalleryItem({
        src: form.src,
        thumbSrc: form.thumbSrc,
        title: form.title.trim(),
        titleRo: form.titleRo.trim(),
        type: form.type.trim() || ROOM_OPTIONS.find((r) => r.value === form.room)?.label || '',
        typeRo: form.typeRo.trim(),
        room: form.room,
      });
      toast.success('Добавлено', 'Новое фото в галерее');
    }
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOriginalForm(EMPTY_FORM);
  };

  // Single delete with undo (delete in DB but keep storage objects for TTL)
  const handleDelete = async (id: string) => {
    const item = gallery.find((g) => g.id === id);
    if (!item) return;

    // keep storage refs in case user undoes — context will skip storage delete
    await deleteGalleryItem(id, { keepImages: true });

    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setConfirmDelete(null);

    const undoId = pushUndo({
      id: `del_${id}`,
      label: 'Удалено фото',
      ttl: 6000,
      undo: async () => {
        await addGalleryItemRaw(item);
      },
    });

    toast.info('Удалено', `Фото «${item.title}» больше не отображается`, {
      duration: 6000,
      action: {
        label: 'Отменить',
        onClick: () => { consumeUndo(undoId); toast.success('Восстановлено', item.title); },
      },
    });
  };

  // Bulk delete with undo
  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setConfirmBulkDelete(false);

    setBulkProgress({ done: 0, total: ids.length });
    const items: GalleryItem[] = [];
    for (let i = 0; i < ids.length; i++) {
      const it = gallery.find((g) => g.id === ids[i]);
      if (!it) continue;
      items.push(it);
      await deleteGalleryItem(ids[i], { keepImages: true });
      if (i % 5 === 0) setBulkProgress({ done: i + 1, total: ids.length });
    }
    setBulkProgress(null);
    setSelected(new Set());

    const undoId = pushUndo({
      id: `bulk_del_${Date.now()}`,
      label: `Удалено фото: ${items.length}`,
      ttl: 8000,
      undo: async () => {
        for (const it of items) await addGalleryItemRaw(it);
      },
    });

    toast.info('Удалено', `Удалено фото: ${items.length}`, {
      duration: 8000,
      action: {
        label: 'Отменить',
        onClick: () => { consumeUndo(undoId); toast.success('Восстановлено', `Возвращено: ${items.length}`); },
      },
    });
  };

  const handleBulkChangeCategory = async (room: GalleryItem['room']) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkProgress({ done: 0, total: ids.length });
    for (let i = 0; i < ids.length; i++) {
      await updateGalleryItem(ids[i], { room });
      if (i % 5 === 0) setBulkProgress({ done: i + 1, total: ids.length });
    }
    setBulkProgress(null);
    toast.success('Обновлено', `Категория изменена для ${ids.length} фото`);
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((i) => i.id)));
  };

  // ============== File upload (single) ==============
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Слишком большой файл', 'Макс. 20 МБ');
      return;
    }
    try {
      const stored = await optimizeAndStore(file);
      setForm((prev) => ({
        ...prev,
        src: stored.src,
        thumbSrc: stored.thumbSrc,
        meta: { width: stored.main.width, height: stored.main.height, size: stored.main.size },
      }));
    } catch {
      toast.error('Ошибка обработки', 'Не удалось загрузить изображение');
    } finally {
      e.target.value = '';
    }
  };

  // ============== Bulk upload ==============
  const handleBulkFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    Promise.all(
      files.map((file) =>
        new Promise<{ src: string; name: string; file: File }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve({ src: ev.target?.result as string, name: file.name, file });
          reader.readAsDataURL(file);
        })
      )
    ).then((results) => setBulkFiles((prev) => [...prev, ...results]));
    e.target.value = '';
  };

  const handleBulkAdd = async () => {
    if (bulkFiles.length === 0) return;
    setBulkLoading(true);
    setBulkProgress({ done: 0, total: bulkFiles.length });
    try {
      for (let i = 0; i < bulkFiles.length; i++) {
        const f = bulkFiles[i];
        const stored = await optimizeAndStore(f.file);
        await addGalleryItem({
          src: stored.src,
          thumbSrc: stored.thumbSrc,
          title: f.name.replace(/\.[^.]+$/, ''),
          titleRo: '',
          type: ROOM_OPTIONS.find((r) => r.value === bulkRoom)?.label || '',
          typeRo: '',
          room: bulkRoom,
        });
        setBulkProgress({ done: i + 1, total: bulkFiles.length });
      }
      toast.success('Добавлено', `Загружено фото: ${bulkFiles.length}`);
      setBulkFiles([]);
      setBulkUploadOpen(false);
    } catch {
      toast.error('Ошибка загрузки', 'Не все фото удалось добавить');
    } finally {
      setBulkLoading(false);
      setBulkProgress(null);
    }
  };

  // ============== DnD reorder ==============
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filtered.findIndex((i) => i.id === active.id);
    const newIndex = filtered.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(filtered, oldIndex, newIndex);
    await reorderGallery(newOrder.map((i) => i.id));
  };

  const inlineUpdateTitle = async (id: string, next: string) => {
    await updateGalleryItem(id, { title: next });
    toast.success('Сохранено', next);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-muted text-sm">
          {gallery.length} {gallery.length === 1 ? 'фото' : 'фото'} в галерее
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-body hover:text-white text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Массовая загрузка</span>
            <span className="sm:hidden">Массово</span>
          </button>
          <button onClick={openAdd} className="btn-primary justify-center text-sm py-2.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Добавить фото</span>
            <span className="sm:hidden">Добавить</span>
            <kbd className="hidden lg:inline-flex text-[10px] border border-white/15 rounded px-1 ml-1 font-mono opacity-70">N</kbd>
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="card rounded-2xl p-3 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
            <input
              data-page-search
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию... (нажмите /)"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-faint focus:outline-none focus:border-primary-400/60 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-body"
                aria-label="Очистить"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint pointer-events-none" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="pl-10 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-primary-400/60 appearance-none cursor-pointer"
              >
                <option value="order_asc">Ручная сортировка</option>
                <option value="date_desc">Сначала новые</option>
                <option value="date_asc">Сначала старые</option>
                <option value="name_asc">По названию А–Я</option>
                <option value="name_desc">По названию Я–А</option>
                <option value="category">По категории</option>
              </select>
            </div>
            <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-subtle hover:text-white'}`}
                aria-label="Сетка"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-subtle hover:text-white'}`}
                aria-label="Список"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white/[0.04] text-body hover:bg-white/[0.08] border border-white/10'
            }`}
          >
            Все ({gallery.length})
          </button>
          {ROOM_OPTIONS.map((opt) => {
            const count = gallery.filter((g) => g.room === opt.value).length;
            const isActive = filter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive ? 'bg-primary-600 text-white' : 'bg-white/[0.04] text-body hover:bg-white/[0.08] border border-white/10'
                }`}
              >
                <span>{opt.emoji}</span>
                {opt.label} ({count})
              </button>
            );
          })}
        </div>

        {!dndEnabled && viewMode === 'grid' && (
          <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Перетаскивание доступно только при «Ручной сортировке» без фильтров и поиска.</span>
          </div>
        )}
      </div>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-primary-600/10 border border-primary-500/30 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-white text-sm">
                <CheckSquare className="w-4 h-4 text-primary-300" />
                <span className="font-medium">Выбрано: {selected.size}</span>
                {bulkProgress && (
                  <span className="text-subtle text-xs">{bulkProgress.done} / {bulkProgress.total}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkChangeCategory(e.target.value as GalleryItem['room']);
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs focus:outline-none cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>Сменить категорию</option>
                  {ROOM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-dark-800">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setConfirmBulkDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Удалить выбранные
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-body text-xs transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Отмена
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={toggleSelectAll}
            className="inline-flex items-center gap-2 text-body hover:text-white text-sm transition-colors"
          >
            {isAllSelected ? <CheckSquare className="w-4 h-4 text-primary-300" /> : <Square className="w-4 h-4" />}
            {isAllSelected ? 'Снять выделение' : 'Выбрать все'}
            <span className="text-faint">({filtered.length})</span>
          </button>
        </div>
      )}

      {/* Grid / List */}
      {filtered.length === 0 ? (
        <div className="card rounded-2xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-faint mx-auto mb-3" />
          <p className="text-muted mb-4">{search || filter !== 'all' ? 'Ничего не найдено' : 'Галерея пуста'}</p>
          <button onClick={openAdd} className="btn-primary inline-flex">
            <Plus className="w-4 h-4" />
            {search || filter !== 'all' ? 'Добавить фото' : 'Добавить первое фото'}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        dndEnabled ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map((i) => i.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filtered.map((item) => (
                  <SortableCard
                    key={item.id}
                    item={item}
                    selected={selected.has(item.id)}
                    onToggle={() => toggleSelect(item.id)}
                    onEdit={() => openEdit(item)}
                    onDelete={() => setConfirmDelete(item.id)}
                    onInlineSave={(t) => inlineUpdateTitle(item.id, t)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((item) => (
              <PhotoCard
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onToggle={() => toggleSelect(item.id)}
                onEdit={() => openEdit(item)}
                onDelete={() => setConfirmDelete(item.id)}
                onInlineSave={(t) => inlineUpdateTitle(item.id, t)}
              />
            ))}
          </div>
        )
      ) : (
        <div className="card rounded-2xl overflow-hidden">
          {filtered.map((item) => (
            <ListRow
              key={item.id}
              item={item}
              selected={selected.has(item.id)}
              onToggle={() => toggleSelect(item.id)}
              onEdit={() => openEdit(item)}
              onDelete={() => setConfirmDelete(item.id)}
              onInlineSave={(t) => inlineUpdateTitle(item.id, t)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeForm}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-800 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl border border-white/10 shadow-soft-lg my-0 sm:my-4 max-h-[95vh] flex flex-col"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-white font-semibold text-lg">
                    {editingId ? 'Редактировать фото' : 'Добавить новое фото'}
                  </h2>
                  {isFormDirty && (
                    <span className="inline-flex items-center gap-1.5 mt-1 text-xs text-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Не сохранено
                    </span>
                  )}
                </div>
                <button
                  onClick={closeForm}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-body hover:text-white transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-muted text-sm font-medium mb-2">Фотография *</label>
                  {form.src ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10 mb-3 aspect-video bg-dark-900">
                      <GalleryThumb src={form.src} alt="Preview" eager />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, src: '', thumbSrc: undefined, meta: undefined })}
                        className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-dark-900/85 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                        aria-label="Удалить изображение"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {form.meta && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-dark-900/85 backdrop-blur-sm border border-white/10 text-[10px] text-body font-mono">
                          {form.meta.width}×{form.meta.height} · {formatBytes(form.meta.size)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-white/15 bg-white/3 hover:bg-white/5 cursor-pointer transition-colors mb-3">
                      <Upload className="w-8 h-8 text-faint mb-2" />
                      <span className="text-muted text-sm">Нажмите для загрузки фото</span>
                      <span className="text-faint text-xs mt-1">JPG / PNG / WebP, до 20 МБ</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  )}
                  <div className="text-subtle text-xs mb-1">Или вставьте URL:</div>
                  <input
                    type="url"
                    value={form.src.startsWith('blob:') ? '' : form.src}
                    onChange={(e) => setForm({ ...form, src: e.target.value, thumbSrc: undefined, meta: undefined })}
                    placeholder="https://example.com/image.jpg"
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-muted text-sm font-medium mb-2">Категория *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {ROOM_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, room: opt.value })}
                        className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs font-medium transition-all ${
                          form.room === opt.value
                            ? 'bg-primary-600 text-white shadow-soft'
                            : 'bg-white/[0.04] text-body hover:bg-white/[0.08] border border-white/10'
                        }`}
                      >
                        <span className="text-lg">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">🇷🇺</span>
                      <span className="text-muted text-xs font-medium">Русский</span>
                    </div>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                      placeholder="Название"
                      className="w-full px-3 py-2 mb-2 rounded-lg bg-dark-900/50 border border-white/10 text-white placeholder-faint focus:outline-none focus:border-primary-400/60 text-sm"
                    />
                    <input
                      type="text"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      placeholder="Тип / описание"
                      className="w-full px-3 py-2 rounded-lg bg-dark-900/50 border border-white/10 text-white placeholder-faint focus:outline-none focus:border-primary-400/60 text-sm"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">🇲🇩</span>
                      <span className="text-muted text-xs font-medium">Română</span>
                    </div>
                    <input
                      type="text"
                      value={form.titleRo}
                      onChange={(e) => setForm({ ...form, titleRo: e.target.value })}
                      placeholder="Denumire"
                      className="w-full px-3 py-2 mb-2 rounded-lg bg-dark-900/50 border border-white/10 text-white placeholder-faint focus:outline-none focus:border-primary-400/60 text-sm"
                    />
                    <input
                      type="text"
                      value={form.typeRo}
                      onChange={(e) => setForm({ ...form, typeRo: e.target.value })}
                      placeholder="Tip / descriere"
                      className="w-full px-3 py-2 rounded-lg bg-dark-900/50 border border-white/10 text-white placeholder-faint focus:outline-none focus:border-primary-400/60 text-sm"
                    />
                  </div>
                </div>
              </form>

              <div className="p-5 border-t border-white/5 flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <button onClick={closeForm} type="button" className="btn-secondary flex-1 justify-center">
                  Отмена
                </button>
                <button onClick={() => handleSubmit()} type="submit" className="btn-primary flex-1 justify-center">
                  <Save className="w-4 h-4" />
                  {editingId ? 'Сохранить' : 'Добавить'}
                  <kbd className="hidden sm:inline-flex text-[10px] border border-white/20 rounded px-1 ml-1 font-mono opacity-70">⌘S</kbd>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk upload modal */}
      <AnimatePresence>
        {bulkUploadOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!bulkLoading) { setBulkUploadOpen(false); setBulkFiles([]); } }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-800 rounded-t-3xl sm:rounded-3xl w-full max-w-3xl border border-white/10 shadow-soft-lg flex flex-col max-h-[95vh]"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <h2 className="text-white font-semibold text-lg">Массовая загрузка фото</h2>
                <button
                  onClick={() => { setBulkUploadOpen(false); setBulkFiles([]); }}
                  disabled={bulkLoading}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-body hover:text-white transition-colors disabled:opacity-50"
                  aria-label="Закрыть"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-muted text-sm font-medium mb-2">
                    Категория для всех загружаемых фото
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {ROOM_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setBulkRoom(opt.value)}
                        className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs font-medium transition-all ${
                          bulkRoom === opt.value
                            ? 'bg-primary-600 text-white shadow-soft'
                            : 'bg-white/[0.04] text-body hover:bg-white/[0.08] border border-white/10'
                        }`}
                      >
                        <span className="text-lg">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col items-center justify-center w-full p-8 rounded-xl border-2 border-dashed border-white/15 bg-white/3 hover:bg-white/5 cursor-pointer transition-colors">
                  <Upload className="w-10 h-10 text-faint mb-3" />
                  <span className="text-white font-medium mb-1">Выберите несколько фото</span>
                  <span className="text-subtle text-sm">Будут автоматически оптимизированы (1920×1080, webp)</span>
                  <input type="file" accept="image/*" multiple onChange={handleBulkFiles} className="hidden" />
                </label>

                {bulkFiles.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted text-sm font-medium">Выбрано: {bulkFiles.length}</span>
                      <button
                        onClick={() => setBulkFiles([])}
                        className="text-red-300 hover:text-red-200 text-xs"
                      >
                        Очистить
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {bulkFiles.map((file, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-dark-900 border border-white/10 group">
                          <img src={file.src} alt={file.name} className="w-full h-full object-cover" />
                          <button
                            onClick={() => setBulkFiles((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 w-6 h-6 rounded-md bg-dark-900/85 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bulkProgress && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted mb-1">
                      <span>Загрузка</span>
                      <span>{bulkProgress.done} / {bulkProgress.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all"
                        style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-white/5 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => { setBulkUploadOpen(false); setBulkFiles([]); }}
                  disabled={bulkLoading}
                  className="btn-secondary flex-1 justify-center disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleBulkAdd}
                  disabled={bulkFiles.length === 0 || bulkLoading}
                  className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {bulkLoading ? 'Загрузка...' : `Загрузить ${bulkFiles.length || ''}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirms */}
      <ConfirmModal
        open={!!confirmDelete}
        title="Удалить фото?"
        description="Можно отменить в течение 6 секунд после удаления."
        confirmText="Удалить"
        variant="danger"
        icon={<Trash2 className="w-5 h-5 text-red-300" />}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmModal
        open={confirmBulkDelete}
        title={`Удалить ${selected.size} фото?`}
        description="Можно отменить в течение 8 секунд после удаления."
        confirmText={`Удалить ${selected.size}`}
        variant="danger"
        icon={<Trash2 className="w-5 h-5 text-red-300" />}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />

      <ConfirmModal
        open={confirmCloseForm}
        title="Закрыть без сохранения?"
        description="У вас есть несохранённые изменения. Они будут потеряны."
        confirmText="Закрыть"
        variant="warning"
        icon={<AlertCircle className="w-5 h-5 text-amber-300" />}
        onConfirm={forceCloseForm}
        onCancel={() => setConfirmCloseForm(false)}
      />
    </div>
  );
}

// ============== Card subcomponents ==============

type CardProps = {
  item: GalleryItem;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onInlineSave: (next: string) => void;
};

function PhotoCard({ item, selected, onToggle, onEdit, onDelete, onInlineSave }: CardProps) {
  return (
    <div
      className={`card rounded-2xl overflow-hidden group transition-colors ${
        selected ? 'ring-2 ring-primary-500/40 border-primary-500/40' : ''
      }`}
    >
      <div className="aspect-video relative overflow-hidden">
        <GalleryThumb src={item.src} thumbSrc={item.thumbSrc} alt={item.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/15 to-transparent opacity-50 group-hover:opacity-90 transition-opacity pointer-events-none" />
        <button
          onClick={onToggle}
          className={`absolute top-2 left-2 w-7 h-7 rounded-lg backdrop-blur-md border flex items-center justify-center transition-all ${
            selected
              ? 'bg-primary-600 border-primary-400 text-white'
              : 'bg-dark-900/60 border-white/20 text-body opacity-0 group-hover:opacity-100'
          }`}
          aria-label={selected ? 'Снять выделение' : 'Выбрать'}
        >
          {selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-md backdrop-blur-sm text-white text-[10px] font-medium ${ROOM_BADGE_COLORS[item.room]}`}>
            {ROOM_OPTIONS.find((r) => r.value === item.room)?.label}
          </span>
        </div>
        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg bg-dark-900/85 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white hover:bg-primary-600 transition-colors"
            aria-label="Редактировать"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg bg-dark-900/85 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
            aria-label="Удалить"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="text-white font-medium text-sm truncate">
          <InlineEdit value={item.title} onSave={onInlineSave} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-subtle text-xs truncate flex-1">{item.type}</div>
          <div className="text-faint text-[10px] flex items-center gap-1 flex-shrink-0 ml-2">
            <Calendar className="w-3 h-3" />
            {new Date(item.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableCard(props: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <PhotoCard {...props} />
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-7 rounded-md bg-dark-900/85 backdrop-blur-sm border border-white/15 text-body hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-grab active:cursor-grabbing"
        aria-label="Перетащить"
        title="Перетащите для изменения порядка"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ListRow({ item, selected, onToggle, onEdit, onDelete, onInlineSave }: CardProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 border-b border-white/5 last:border-0 transition-colors ${
        selected ? 'bg-primary-600/10' : 'hover:bg-white/[0.03]'
      }`}
    >
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
          selected ? 'bg-primary-600 text-white' : 'bg-white/[0.04] text-faint hover:text-white'
        }`}
        aria-label="Выбрать"
      >
        {selected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
      </button>
      <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden flex-shrink-0">
        <GalleryThumb src={item.src} thumbSrc={item.thumbSrc} alt={item.title} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium text-sm truncate">
          <InlineEdit value={item.title} onSave={onInlineSave} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${ROOM_BADGE_COLORS[item.room]}`}>
            {ROOM_OPTIONS.find((r) => r.value === item.room)?.label}
          </span>
          <span className="text-subtle text-xs truncate">{item.type}</span>
        </div>
      </div>
      <div className="hidden sm:block text-subtle text-xs flex-shrink-0">
        {new Date(item.createdAt).toLocaleDateString('ru-RU')}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-primary-600 border border-white/10 flex items-center justify-center text-body hover:text-white transition-colors"
          aria-label="Редактировать"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-red-500 border border-white/10 flex items-center justify-center text-body hover:text-white transition-colors"
          aria-label="Удалить"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
