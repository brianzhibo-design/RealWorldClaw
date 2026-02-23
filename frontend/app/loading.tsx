export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-700 rounded-full animate-spin">
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-sky-400 rounded-full animate-spin"></div>
          </div>
        </div>
        
        {/* Loading text */}
        <p className="text-slate-400 text-sm font-medium animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}