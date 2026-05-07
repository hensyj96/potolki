/* Skeleton placeholders for async admin pages. */

function Bar({ className = '' }: { className?: string }) {
  return <div className={`bg-white/[0.05] rounded ${className} animate-pulse`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6">
        <Bar className="h-3 w-24 mb-3" />
        <Bar className="h-7 w-48 mb-2" />
        <Bar className="h-3 w-40" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card rounded-2xl p-5">
            <Bar className="h-9 w-9 rounded-xl mb-3" />
            <Bar className="h-7 w-16 mb-1.5" />
            <Bar className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 card rounded-2xl p-5 h-56" />
        <div className="card rounded-2xl p-5 h-56" />
      </div>
    </div>
  );
}

export function GallerySkeleton() {
  return (
    <div className="space-y-5">
      <Bar className="h-12 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card rounded-2xl overflow-hidden">
            <div className="aspect-video bg-white/[0.05] animate-pulse" />
            <div className="p-3 space-y-2">
              <Bar className="h-4 w-3/4" />
              <Bar className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeoSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-4 xl:col-span-3 space-y-3">
        <div className="card rounded-2xl p-3 h-80" />
        <div className="card rounded-2xl p-3 h-24" />
      </div>
      <div className="lg:col-span-8 xl:col-span-9 space-y-4">
        <div className="card rounded-2xl p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-32" />
              <Bar className="h-10 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-5">
      <Bar className="h-10 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card rounded-2xl p-5">
            <Bar className="h-9 w-9 rounded-xl mb-3" />
            <Bar className="h-7 w-16 mb-1.5" />
            <Bar className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="card rounded-2xl p-5 h-56" />
    </div>
  );
}

export function AdminLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-dark-900 flex">
      <aside className="hidden lg:block w-72 bg-dark-800 border-r border-white/5 flex-shrink-0 p-5">
        <Bar className="h-10 w-32 mb-8" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Bar key={i} className="h-10 rounded-xl" />)}
        </div>
      </aside>
      <main className="flex-1 p-8 space-y-4">
        <Bar className="h-10 w-1/3" />
        <Bar className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Bar key={i} className="h-24 rounded-2xl" />)}
        </div>
      </main>
    </div>
  );
}
