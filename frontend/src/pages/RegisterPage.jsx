import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, Mail, Lock, User, ArrowRight, Building2, Home } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('landlord');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = await register(name, email, password, role);
      toast.success('Account created successfully!');
      // Redirect based on role
      if (userData.role === 'tenant') {
        navigate('/tenant');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A192F] bg-grid-pattern flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#00FFAB] flex items-center justify-center">
            <Leaf className="w-7 h-7 text-black" />
          </div>
          <span className="font-bold text-2xl text-white font-['Outfit']">EcoRent UK</span>
        </Link>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2 font-['Outfit']">Create Account</h1>
          <p className="text-slate-400 text-center mb-6">Join EcoRent UK today</p>

          {/* Role Selection */}
          <div className="mb-6">
            <Label className="text-slate-300 mb-3 block">I am a...</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('landlord')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  role === 'landlord'
                    ? 'border-[#00FFAB] bg-[#00FFAB]/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
                data-testid="role-landlord"
              >
                <Building2 className={`w-8 h-8 mx-auto mb-2 ${
                  role === 'landlord' ? 'text-[#00FFAB]' : 'text-slate-400'
                }`} />
                <p className={`font-medium ${role === 'landlord' ? 'text-[#00FFAB]' : 'text-white'}`}>
                  Landlord
                </p>
                <p className="text-slate-400 text-xs mt-1">Manage properties</p>
              </button>
              
              <button
                type="button"
                onClick={() => setRole('tenant')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  role === 'tenant'
                    ? 'border-[#00FFAB] bg-[#00FFAB]/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
                data-testid="role-tenant"
              >
                <Home className={`w-8 h-8 mx-auto mb-2 ${
                  role === 'tenant' ? 'text-[#00FFAB]' : 'text-slate-400'
                }`} />
                <p className={`font-medium ${role === 'tenant' ? 'text-[#00FFAB]' : 'text-white'}`}>
                  Tenant
                </p>
                <p className="text-slate-400 text-xs mt-1">Rent a property</p>
              </button>
            </div>
          </div>

          {/* Google Sign Up */}
          <Button
            onClick={() => loginWithGoogle()}
            variant="outline"
            className="w-full mb-6 bg-white/5 border-white/10 text-white hover:bg-white/10 py-6"
            data-testid="google-register-btn"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0A192F] text-slate-400">or register with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10 bg-[#0A192F]/50 border-white/10 text-white placeholder:text-slate-500"
                  data-testid="register-name-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-[#0A192F]/50 border-white/10 text-white placeholder:text-slate-500"
                  data-testid="register-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 bg-[#0A192F]/50 border-white/10 text-white placeholder:text-slate-500"
                  data-testid="register-password-input"
                />
              </div>
              <p className="text-xs text-slate-500">Minimum 6 characters</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
              data-testid="register-submit-btn"
            >
              {loading ? 'Creating account...' : `Create ${role === 'landlord' ? 'Landlord' : 'Tenant'} Account`}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>

          <p className="text-center text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#00FFAB] hover:underline" data-testid="login-link">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
