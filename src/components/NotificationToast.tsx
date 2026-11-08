import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useLeadContext } from '../context/LeadContext';

export const NotificationToast: React.FC = () => {
  const { toasts, removeToast } = useLeadContext();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;
        let borderClass = 'border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]';
        let bgGradient = 'bg-gradient-to-r from-[#0f1b35] to-[#15254b]';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          borderClass = 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
          bgGradient = 'bg-gradient-to-r from-[#0f2425] to-[#132c30]';
        } else if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          borderClass = 'border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]';
          bgGradient = 'bg-gradient-to-r from-[#28111a] to-[#331522]';
        } else if (toast.type === 'warning') {
          icon = <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />;
          borderClass = 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]';
          bgGradient = 'bg-gradient-to-r from-[#291e10] to-[#362512]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md text-slate-100 ${bgGradient} ${borderClass} transition-all duration-300 transform translate-y-0`}
          >
            <div className="pt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold tracking-wide text-slate-200">{toast.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 -mr-1"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
