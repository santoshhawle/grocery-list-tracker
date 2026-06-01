import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'user' as 'user' | 'manager', teamName: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await api.auth.register({
        ...form,
        teamName: form.teamName.trim() || undefined,
      });
      login(token, user);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">Start tracking your remote work wellbeing</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" type="text" required className="input"
              value={form.name} onChange={(e) => set('name', e.target.value)}
              placeholder="Alex Smith" />
          </div>

          <div>
            <label className="label" htmlFor="email">Email address</label>
            <input id="email" type="email" required autoComplete="email" className="input"
              value={form.email} onChange={(e) => set('email', e.target.value)}
              placeholder="you@example.com" />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" required autoComplete="new-password" className="input"
              value={form.password} onChange={(e) => set('password', e.target.value)}
              placeholder="Min. 8 characters" />
          </div>

          <div>
            <label className="label" htmlFor="role">I am a…</label>
            <select id="role" className="input" value={form.role}
              onChange={(e) => set('role', e.target.value)}>
              <option value="user">Team member</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="teamName">
              Team name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input id="teamName" type="text" className="input"
              value={form.teamName} onChange={(e) => set('teamName', e.target.value)}
              placeholder="e.g. Engineering, Design…" />
            <p className="text-xs text-gray-400 mt-1">
              Join the same team name to share anonymised insights with your manager.
            </p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
