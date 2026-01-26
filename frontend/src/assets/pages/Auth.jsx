import React, { useState } from 'react';

const Auth = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:8080/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorMessage = await response.text(); 
        throw new Error(errorMessage || "Invalid credentials.");
      }

      const data = await response.json();
      
      // Clear old sessions first
      localStorage.clear();
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      
      onLoginSuccess(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-6">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="max-w-[440px] w-full">
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 p-10 border border-slate-100 relative overflow-hidden">
          
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>

          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto mb-6 shadow-xl shadow-indigo-200 transform -rotate-3">
              I
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
              Terminal <span className="text-indigo-600">PRO</span>
            </h2>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mt-2">
              Management Portal
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold rounded-xl flex items-center gap-3 animate-shake">
              <span className="text-lg">⚠️</span>
              <span className="uppercase tracking-wide">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                Username
              </label>
              <div className="relative">
                <input
                  required
                  className="w-full py-4 px-5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 shadow-sm"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
                <span className="absolute right-5 top-4 opacity-20">👤</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  className="w-full py-4 px-5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 shadow-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-4 opacity-40 hover:opacity-100 transition-opacity"
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[12px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 active:scale-[0.98] disabled:opacity-50 group"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Sign In to System"
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
              Authorized Personnel Only
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          © 2026 Inventory Management Systems
        </p>
      </div>
    </div>
  );
};

export default Auth;