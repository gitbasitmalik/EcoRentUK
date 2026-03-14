import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, authFetch } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  User, 
  Shield, 
  Bell,
  PoundSterling,
  Globe,
  Save,
  Key,
  Trash2,
  Smartphone,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      new_leads: true,
      urgent_messages: true,
      epc_reminders: true,
      marketing: false
    }
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // Change Password State
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA State
  const [twoFADialogOpen, setTwoFADialogOpen] = useState(false);
  const [twoFASetupData, setTwoFASetupData] = useState(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [disableTwoFADialogOpen, setDisableTwoFADialogOpen] = useState(false);
  const [disableTwoFACode, setDisableTwoFACode] = useState('');
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Delete Account State
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch user settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await authFetch(`${API_URL}/api/user/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings || settings);
          setTwoFactorEnabled(data.two_factor_enabled || false);
          setHasPassword(data.password_set || false);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Save notification settings
  const handleNotificationToggle = async (key) => {
    const newNotifications = {
      ...settings.notifications,
      [key]: !settings.notifications[key]
    };

    setSettings(prev => ({
      ...prev,
      notifications: newNotifications
    }));

    try {
      const response = await authFetch(`${API_URL}/api/user/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: newNotifications }),
      });

      if (response.ok) {
        toast.success('Settings saved');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      // Revert on error
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: !newNotifications[key]
        }
      }));
      toast.error('Failed to save settings');
    }
  };

  // Change Password Handler
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await authFetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        }),
      });

      if (response.ok) {
        toast.success('Password changed successfully');
        setPasswordDialogOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // 2FA Setup Handler
  const handleSetup2FA = async () => {
    setTwoFALoading(true);
    try {
      const response = await authFetch(`${API_URL}/api/auth/2fa/setup`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFASetupData(data);
        setTwoFADialogOpen(true);
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to setup 2FA');
      }
    } catch (error) {
      toast.error('Failed to setup 2FA');
    } finally {
      setTwoFALoading(false);
    }
  };

  // Verify 2FA Handler
  const handleVerify2FA = async () => {
    if (twoFACode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setTwoFALoading(true);
    try {
      const response = await authFetch(`${API_URL}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFACode }),
      });

      if (response.ok) {
        toast.success('Two-factor authentication enabled!');
        setTwoFactorEnabled(true);
        setTwoFADialogOpen(false);
        setTwoFASetupData(null);
        setTwoFACode('');
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Invalid verification code');
      }
    } catch (error) {
      toast.error('Failed to verify 2FA');
    } finally {
      setTwoFALoading(false);
    }
  };

  // Disable 2FA Handler
  const handleDisable2FA = async () => {
    if (disableTwoFACode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setTwoFALoading(true);
    try {
      const response = await authFetch(`${API_URL}/api/auth/2fa/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableTwoFACode }),
      });

      if (response.ok) {
        toast.success('Two-factor authentication disabled');
        setTwoFactorEnabled(false);
        setDisableTwoFADialogOpen(false);
        setDisableTwoFACode('');
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Invalid verification code');
      }
    } catch (error) {
      toast.error('Failed to disable 2FA');
    } finally {
      setTwoFALoading(false);
    }
  };

  // Delete Account Handler
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const response = await authFetch(`${API_URL}/api/auth/delete-account`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Account deleted successfully');
        await logout();
        navigate('/');
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to delete account');
      }
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Copy backup codes
  const copyBackupCodes = () => {
    if (twoFASetupData?.backup_codes) {
      navigator.clipboard.writeText(twoFASetupData.backup_codes.join('\n'));
      setCopiedBackupCodes(true);
      toast.success('Backup codes copied to clipboard');
      setTimeout(() => setCopiedBackupCodes(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#00FFAB] text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white font-['Outfit']">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#00FFAB]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[#00FFAB]" />
              </div>
              <h2 className="text-xl font-semibold text-white font-['Outfit']">Profile</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {user?.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    className="w-20 h-20 rounded-full border-2 border-[#00FFAB]/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#00FFAB]/20 flex items-center justify-center">
                    <span className="text-[#00FFAB] text-2xl font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold">{user?.name}</p>
                  <p className="text-slate-400 text-sm">{user?.email}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Full Name</Label>
                  <Input
                    defaultValue={user?.name}
                    className="bg-[#0A192F]/50 border-white/10 text-white"
                    data-testid="settings-name-input"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Email</Label>
                  <Input
                    defaultValue={user?.email}
                    disabled
                    className="bg-[#0A192F]/50 border-white/10 text-white opacity-50"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Preferences Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white font-['Outfit']">Preferences</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <PoundSterling className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-white font-medium">Currency</p>
                    <p className="text-slate-400 text-sm">Display prices in</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#00FFAB]/20 text-[#00FFAB] text-sm font-medium">
                  GBP (£)
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-white font-medium">Language</p>
                    <p className="text-slate-400 text-sm">Interface language</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#00FFAB]/20 text-[#00FFAB] text-sm font-medium">
                  English (UK)
                </span>
              </div>
            </div>
          </motion.div>

          {/* Notifications Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white font-['Outfit']">Notifications</h2>
            </div>

            <div className="space-y-4">
              {[
                { key: 'new_leads', label: 'New lead notifications', description: 'Get notified when someone submits a lead form' },
                { key: 'urgent_messages', label: 'Urgent tenant messages', description: 'Receive alerts for urgent chat messages' },
                { key: 'epc_reminders', label: 'EPC compliance reminders', description: 'Reminders about upcoming EPC requirements' },
                { key: 'marketing', label: 'Marketing emails', description: 'Tips and updates from EcoRent' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="text-white font-medium">{item.label}</p>
                    <p className="text-slate-400 text-sm">{item.description}</p>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle(item.key)}
                    className="relative inline-flex items-center cursor-pointer"
                    data-testid={`toggle-${item.key}`}
                  >
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      settings.notifications[item.key] ? 'bg-[#00FFAB]' : 'bg-[#1E293B]'
                    }`}>
                      <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.notifications[item.key] ? 'translate-x-[22px]' : 'translate-x-[2px]'
                      }`} />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Security */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-lg font-semibold text-white font-['Outfit']">Security</h2>
            </div>

            <div className="space-y-4">
              {/* Password */}
              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="w-4 h-4 text-slate-400" />
                  <p className="text-white font-medium">Password</p>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  {hasPassword ? 'Change your account password' : 'Set a password for your account'}
                </p>
                <Button
                  onClick={() => setPasswordDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="btn-secondary py-2 px-4 text-sm"
                  data-testid="change-password-btn"
                  disabled={!hasPassword}
                >
                  {hasPassword ? 'Change Password' : 'OAuth Account'}
                </Button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <p className="text-white font-medium">Two-Factor Auth</p>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  {twoFactorEnabled ? 'Enabled - Your account is extra secure' : 'Add an extra layer of security'}
                </p>
                {twoFactorEnabled ? (
                  <Button
                    onClick={() => setDisableTwoFADialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 py-2 px-4 text-sm"
                    data-testid="disable-2fa-btn"
                  >
                    Disable 2FA
                  </Button>
                ) : (
                  <Button
                    onClick={handleSetup2FA}
                    disabled={twoFALoading}
                    variant="outline"
                    size="sm"
                    className="btn-secondary py-2 px-4 text-sm"
                    data-testid="enable-2fa-btn"
                  >
                    {twoFALoading ? 'Setting up...' : 'Enable 2FA'}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6 border border-red-500/30"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-red-400 font-semibold">Danger Zone</h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Once you delete your account, there is no going back. All your properties, chats, and data will be permanently removed.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  data-testid="delete-account-btn"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    This action cannot be undone. This will permanently delete your account and remove all your data including properties, chat history, and settings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleteLoading ? 'Deleting...' : 'Yes, delete my account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Change Password</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your current password and a new password below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300">Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-[#0A192F]/50 border-white/10 text-white"
                data-testid="current-password-input"
              />
            </div>
            <div>
              <Label className="text-slate-300">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-[#0A192F]/50 border-white/10 text-white"
                data-testid="new-password-input"
              />
            </div>
            <div>
              <Label className="text-slate-300">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#0A192F]/50 border-white/10 text-white"
                data-testid="confirm-password-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setPasswordDialogOpen(false)}
              variant="outline"
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              className="btn-primary"
              data-testid="submit-password-btn"
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={twoFADialogOpen} onOpenChange={setTwoFADialogOpen}>
        <DialogContent className="glass border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-slate-400">
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>
          {twoFASetupData && (
            <div className="space-y-6 py-4">
              {/* QR Code Placeholder - In production, use a QR code library */}
              <div className="bg-white p-4 rounded-xl mx-auto w-48 h-48 flex items-center justify-center">
                <div className="text-center">
                  <Smartphone className="w-12 h-12 text-[#0A192F] mx-auto mb-2" />
                  <p className="text-[#0A192F] text-xs font-mono break-all">{twoFASetupData.secret}</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-2">Or enter this code manually:</p>
                <code className="bg-white/10 px-4 py-2 rounded-lg text-[#00FFAB] font-mono text-lg">
                  {twoFASetupData.secret}
                </code>
              </div>

              {/* Backup Codes */}
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-orange-400 font-medium text-sm">Backup Codes (Save these!)</p>
                  <Button
                    onClick={copyBackupCodes}
                    size="sm"
                    variant="ghost"
                    className="text-orange-400 hover:text-orange-300 h-8 px-2"
                  >
                    {copiedBackupCodes ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {twoFASetupData.backup_codes.map((code, i) => (
                    <code key={i} className="bg-white/5 px-2 py-1 rounded text-slate-300 text-sm font-mono text-center">
                      {code}
                    </code>
                  ))}
                </div>
              </div>

              {/* Verification */}
              <div>
                <Label className="text-slate-300">Enter the 6-digit code from your app</Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="bg-[#0A192F]/50 border-white/10 text-white text-center text-2xl tracking-widest font-mono"
                  data-testid="2fa-code-input"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                setTwoFADialogOpen(false);
                setTwoFASetupData(null);
                setTwoFACode('');
              }}
              variant="outline"
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify2FA}
              disabled={twoFALoading || twoFACode.length !== 6}
              className="btn-primary"
              data-testid="verify-2fa-btn"
            >
              {twoFALoading ? 'Verifying...' : 'Enable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={disableTwoFADialogOpen} onOpenChange={setDisableTwoFADialogOpen}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter the 6-digit code from your authenticator app to disable 2FA.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="text"
              maxLength={6}
              value={disableTwoFACode}
              onChange={(e) => setDisableTwoFACode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="bg-[#0A192F]/50 border-white/10 text-white text-center text-2xl tracking-widest font-mono"
              data-testid="disable-2fa-code-input"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setDisableTwoFADialogOpen(false);
                setDisableTwoFACode('');
              }}
              variant="outline"
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDisable2FA}
              disabled={twoFALoading || disableTwoFACode.length !== 6}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="confirm-disable-2fa-btn"
            >
              {twoFALoading ? 'Disabling...' : 'Disable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
