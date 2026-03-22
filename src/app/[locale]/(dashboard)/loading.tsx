"use client";

export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Skeleton for Header Title area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="h-8 w-48 bg-slate-200/50 rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-slate-200/50 rounded-lg animate-pulse" />
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 gap-6">
        <div className="h-[400px] w-full bg-slate-100/50 rounded-2xl border border-slate-200/50 animate-pulse flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 w-full bg-slate-100/50 rounded-xl border border-slate-200/50 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
