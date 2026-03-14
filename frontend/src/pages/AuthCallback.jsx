import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Leaf, Building2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

// This page is only shown when a Google user needs to pick a role
export const AuthCallback = () => {
  const navigate = useNavigate();
  const { setRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [settingRole, setSettingRole] = useState(false);

  const handleRoleSelect = async () => {
    if (!selectedRole) return;
    setSettingRole(true);
    try {
      const userData = await setRole(selectedRole);
      toast.success('Account created successfully!');
      navigate(userData.role === 'tenant' ? '/tenant' : '/dashboard', { replace: true });
    } catch (error) {
      toast.error('Failed to set account type. Please try again.');
    } finally {
      setSettingRole(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A192F] bg-grid-pattern flex items-center justify-center p-4" data-testid="role-selection-screen">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#00FFAB] flex items-center justify-center">
            <Leaf className="w-7 h-7 text-black" />
          </div>
          <span className="font-bold text-2xl text-white font-['Outfit']">EcoRent UK</span>
        </div>

        <div className="glass rounded-2xl p-8 backdrop-blur-xl border border-white/10">
          <h1 className="text-2xl font-bold text-white text-center mb-2 font-['Outfit']">Select Your Account Type</h1>
          <p className="text-slate-400 text-center mb-8">How will you use EcoRent UK?</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setSelectedRole('landlord')}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                selectedRole === 'landlord'
                  ? 'border-[#00FFAB] bg-[#00FFAB]/10 shadow-[0_0_30px_rgba(0,255,171,0.15)]'
                  : 'border-white/10 hover:border-white/25 bg-white/5'
              }`}
              data-testid="select-role-landlord"
            >
              <Building2 className={`w-10 h-10 mx-auto mb-3 transition-colors ${selectedRole === 'landlord' ? 'text-[#00FFAB]' : 'text-slate-400'}`} />
              <p className={`font-semibold text-lg transition-colors ${selectedRole === 'landlord' ? 'text-[#00FFAB]' : 'text-white'}`}>Landlord</p>
              <p className="text-slate-400 text-sm mt-1">Manage your properties</p>
              {selectedRole === 'landlord' && (
                <motion.div layoutId="role-indicator" className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#00FFAB] flex items-center justify-center">
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('tenant')}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                selectedRole === 'tenant'
                  ? 'border-[#00FFAB] bg-[#00FFAB]/10 shadow-[0_0_30px_rgba(0,255,171,0.15)]'
                  : 'border-white/10 hover:border-white/25 bg-white/5'
              }`}
              data-testid="select-role-tenant"
            >
              <Home className={`w-10 h-10 mx-auto mb-3 transition-colors ${selectedRole === 'tenant' ? 'text-[#00FFAB]' : 'text-slate-400'}`} />
              <p className={`font-semibold text-lg transition-colors ${selectedRole === 'tenant' ? 'text-[#00FFAB]' : 'text-white'}`}>Tenant</p>
              <p className="text-slate-400 text-sm mt-1">Find your next home</p>
              {selectedRole === 'tenant' && (
                <motion.div layoutId="role-indicator" className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#00FFAB] flex items-center justify-center">
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </button>
          </div>

          <Button
            onClick={handleRoleSelect}
            disabled={!selectedRole || settingRole}
            className="w-full btn-primary py-3 text-base"
            data-testid="confirm-role-btn"
          >
            {settingRole ? 'Setting up...' : 'Continue'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
