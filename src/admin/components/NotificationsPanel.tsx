import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Image as ImageIcon, Search, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import type { NotificationKind } from '../../db/database';

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  gallery_added: ImageIcon,
  gallery_deleted: Trash2,
  seo_changed: Search,
  cta: Phone,
};

const KIND_COLOR: Record<NotificationKind, string> = {
  gallery_added: 'bg-green-500/20 text-green-300',
  gallery_deleted: 'bg-red-500/20 text-red-300',
  seo_changed: 'bg-primary-600/20 text-primary-300',
  cta: 'bg-amber-500/20 text-amber-300',
};

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'только что';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} мин назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} дн назад`;
  return new Date(ms).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NotificationsPanel({ open, onClose }: Props) {
  const { notifications, markAllNotificationsRead, clearNotifications } = useAdmin();

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-dark-800 border border-white/10 rounded-xl overflow-hidden shadow-soft-lg z-40"
          >
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <Bell className="w-4 h-4 text-primary-300" />
                Уведомления
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => markAllNotificationsRead()}
                  className="text-xs text-subtle hover:text-white px-2 py-1 rounded-md hover:bg-white/[0.06] transition-colors flex items-center gap-1"
                  title="Прочитать всё"
                >
                  <Check className="w-3 h-3" />
                  Всё
                </button>
                <button
                  onClick={() => clearNotifications()}
                  className="text-xs text-subtle hover:text-red-300 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors flex items-center gap-1"
                  title="Очистить"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] mx-auto flex items-center justify-center mb-2">
                    <Bell className="w-4 h-4 text-faint" />
                  </div>
                  <div className="text-muted text-sm">Уведомлений пока нет</div>
                  <div className="text-faint text-xs mt-1">
                    Здесь появятся изменения галереи и SEO
                  </div>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = KIND_ICON[n.kind];
                  const color = KIND_COLOR[n.kind];
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-3 py-2.5 border-b border-white/[0.04] last:border-0 transition-colors ${
                        n.read ? '' : 'bg-primary-600/[0.04]'
                      } hover:bg-white/[0.03]`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{n.title}</div>
                        <div className="text-[10px] text-subtle mt-0.5">{timeAgo(n.createdAt)}</div>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0 mt-2" aria-label="Не прочитано" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
