import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="card rounded-2xl p-10 sm:p-14 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary-600/15 border border-primary-500/25 flex items-center justify-center mx-auto mb-5">
        <Compass className="w-6 h-6 text-primary-300" />
      </div>
      <h1 className="text-white font-display font-semibold text-2xl mb-2">Страница не найдена</h1>
      <p className="text-body text-sm max-w-md mx-auto mb-6">
        В админке нет такой страницы. Проверьте URL или вернитесь на дашборд.
      </p>
      <Link to="/admin" className="btn-primary inline-flex">
        <ArrowLeft className="w-4 h-4" />
        На дашборд
      </Link>
    </div>
  );
}
