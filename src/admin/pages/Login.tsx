import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, Shield } from 'lucide-react';

export default function Login() {
  const { login, isAuthenticated, authReady } = useAdmin();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (authReady && isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, authReady, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email.trim(), password);
    if (result.ok) {
      toast.success('Вход выполнен', 'Добро пожаловать в админ-панель');
      navigate('/admin', { replace: true });
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      toast.error('Ошибка входа', result.error || 'Неверный логин или пароль');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="ambient-bg" />
      <div className="grid-overlay" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{
          opacity: 1, y: 0,
          x: shake ? [0, -8, 8, -6, 6, 0] : 0,
        }}
        transition={{
          duration: shake ? 0.45 : 0.5,
          ease: 'easeOut' as const,
        }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-soft">
              <span className="text-white font-bold text-xl leading-none">P</span>
            </div>
            <span className="font-display font-semibold text-2xl text-white">
              Potolki<span className="text-primary-300">.md</span>
            </span>
          </div>
          <p className="text-subtle text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Admin Panel
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <h1 className="text-white font-semibold text-xl mb-2 flex items-center gap-2">
            Добро пожаловать
            <Sparkles className="w-4 h-4 text-primary-300" />
          </h1>
          <p className="text-muted text-sm mb-6">Войдите с почтой и паролем администратора</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-muted text-sm mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                  autoComplete="email"
                  className="input-field pl-10 disabled:opacity-50"
                  placeholder="admin@potolki.md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-pwd" className="block text-muted text-sm mb-1.5">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                <input
                  id="login-pwd"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="input-field pl-10 pr-10 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  tabIndex={-1}
                  aria-label={showPwd ? 'Скрыть пароль' : 'Показать пароль'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-white/70 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base py-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Вход...
                </>
              ) : (
                <>
                  Войти
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-3 rounded-xl bg-primary-600/[0.06] border border-primary-500/20">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary-300 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-xs text-muted">
                <div className="font-medium text-primary-200 mb-1">Нет учётной записи?</div>
                <div>Создайте администратора в Supabase Dashboard → Authentication → Users → Add user, затем установите ему роль <code className="text-primary-200 bg-primary-600/15 px-1 rounded">admin</code> в app_metadata.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link
            to="/"
            className="text-faint hover:text-white/70 text-xs transition-colors"
          >
            ← Вернуться на сайт
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
