import React from 'react';

const SuccessAlert = ({ show, title, message, onConfirm, type = 'success' }) => {
  if (!show) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4">
      <style>{`
        @keyframes drawRing {
          from { stroke-dashoffset: 251; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeInIcon {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-ring {
          stroke-dasharray: 251;
          animation: drawRing 0.6s ease-out forwards;
        }
        .animate-icon {
          animation: fadeInIcon 0.4s 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          opacity: 0;
        }
      `}</style>

      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-8 flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Animated Circle Icon */}
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className={`${isSuccess ? 'text-emerald-100' : 'text-rose-100'}`}
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray="251"
              strokeLinecap="round"
              className={`animate-ring ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center animate-icon">
            {isSuccess ? (
              <span className="text-5xl text-emerald-500 font-bold">✓</span>
            ) : (
              <span className="text-5xl text-rose-500 font-bold">✕</span>
            )}
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-700 tracking-tight mb-2 uppercase">
          {title}
        </h2>
        
        <p className="text-slate-500 text-center mb-8 font-medium leading-relaxed px-2">
          {message}
        </p>
        
        <button 
          onClick={onConfirm}
          className={`w-full py-3 ${isSuccess ? 'bg-[#87CEEB]' : 'bg-rose-500'} hover:opacity-90 text-white font-bold rounded shadow-sm transition-all uppercase tracking-widest text-sm`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessAlert;