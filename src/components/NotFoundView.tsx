import React from 'react';
import { ArrowLeft, Compass } from 'lucide-react';

interface NotFoundViewProps {
  onReturnHome: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onReturnHome }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7FC] dark:bg-[#0A0714] text-[#141024] dark:text-[#F4F1FF] p-6">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-8 text-center space-y-5 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6 text-violet-500" />
        </div>
        <div className="space-y-2">
          <p className="font-mono-tabular text-xs font-semibold tracking-widest uppercase text-rose-500">
            Error 404
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            Lost Between Stars
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            This route does not exist in RSverse. Return to your private two-player universe.
          </p>
        </div>
        <button
          type="button"
          onClick={onReturnHome}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-sm font-semibold hover:opacity-95 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to RSverse
        </button>
      </div>
    </div>
  );
};
