import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, authFetch } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Leaf, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  PoundSterling,
  Zap,
  Bell,
  CheckCircle,
  XCircle,
  Mail
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Animated Circular Progress
const CircularProgress = ({ value, maxValue = 100, label, color = '#00FFAB', size = 120 }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const circumference = 2 * Math.PI * 45;
  const progress = (animatedValue / maxValue) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r="45"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="progress-circle"
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-3xl font-bold text-white">{Math.round(animatedValue)}</span>
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, trend, color = '#00FFAB', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass rounded-2xl p-6 card-interactive"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      {trend && (
        <span className={`text-sm font-medium flex items-center gap-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-slate-400 text-sm mb-1">{label}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
  </motion.div>
);

// Quick Action Card
const QuickActionCard = ({ icon: Icon, title, description, to, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Link
      to={to}
      className="glass rounded-2xl p-6 flex items-center gap-4 card-interactive block"
    >
      <div className="w-12 h-12 rounded-xl bg-[#00FFAB]/20 flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-[#00FFAB]" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-slate-400 text-sm truncate">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-slate-500" />
    </Link>
  </motion.div>
);

// Compliance Score Widget
const ComplianceScoreWidget = ({ stats }) => {
  const compliantCount = stats?.compliant_properties || 0;
  const nonCompliantCount = stats?.non_compliant_properties || 0;
  const totalCount = stats?.property_count || 0;
  const compliancePercentage = stats?.compliance_percentage || 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.7 }}
      className="glass rounded-2xl p-8"
    >
      <h3 className="text-lg font-semibold text-white mb-6 font-['Outfit']">2028 Compliance Score</h3>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">EPC C+ Compliance</span>
          <span className={compliancePercentage >= 100 ? 'text-[#00FFAB]' : 'text-orange-400'}>
            {compliancePercentage}%
          </span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${compliancePercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              compliancePercentage >= 100 ? 'bg-[#00FFAB]' : 
              compliancePercentage >= 50 ? 'bg-orange-400' : 'bg-red-500'
            }`}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Compliant</span>
          </div>
          <p className="text-2xl font-bold text-white">{compliantCount}</p>
          <p className="text-slate-400 text-xs">EPC C or above</p>
        </div>
        
        <div className={`rounded-xl p-4 ${
          nonCompliantCount > 0 
            ? 'bg-orange-500/10 border border-orange-500/20' 
            : 'bg-white/5 border border-white/10'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <XCircle className={`w-5 h-5 ${nonCompliantCount > 0 ? 'text-orange-400' : 'text-slate-500'}`} />
            <span className={nonCompliantCount > 0 ? 'text-orange-400' : 'text-slate-500'}>Needs Work</span>
          </div>
          <p className="text-2xl font-bold text-white">{nonCompliantCount}</p>
          <p className="text-slate-400 text-xs">Below EPC C</p>
        </div>
      </div>

      {/* Warning if non-compliant */}
      {nonCompliantCount > 0 && (
        <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-400 font-medium text-sm">Action Required</p>
              <p className="text-slate-400 text-xs mt-1">
                {nonCompliantCount} {nonCompliantCount === 1 ? 'property needs' : 'properties need'} 
                {' '}upgrades before the 2028 EPC C minimum requirement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All compliant message */}
      {totalCount > 0 && nonCompliantCount === 0 && (
        <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400 font-medium text-sm">All properties are 2028 compliant!</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingTestNotification, setSendingTestNotification] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authFetch(`${API_URL}/api/dashboard/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleTestNotification = async () => {
    setSendingTestNotification(true);
    try {
      const response = await authFetch(`${API_URL}/api/notifications/test`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'Test notification sent!');
      } else {
        toast.error(data.detail || 'Failed to send notification');
      }
    } catch (error) {
      toast.error('Failed to send test notification');
    } finally {
      setSendingTestNotification(false);
    }
  };

  const getEPCGrade = (score) => {
    if (score >= 92) return 'A';
    if (score >= 81) return 'B';
    if (score >= 69) return 'C';
    if (score >= 55) return 'D';
    if (score >= 39) return 'E';
    if (score >= 21) return 'F';
    return 'G';
  };

  return (
    <div className="space-y-8" data-testid="dashboard-overview">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white font-['Outfit']">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-400 mt-1">Here's what's happening with your properties today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleTestNotification}
            disabled={sendingTestNotification}
            variant="outline"
            className="btn-secondary py-2 px-4"
            data-testid="test-notification-btn"
          >
            <Mail className="w-4 h-4 mr-2" />
            {sendingTestNotification ? 'Sending...' : 'Test Notification'}
          </Button>
          <Link
            to="/dashboard/properties"
            className="btn-primary inline-flex items-center gap-2 text-center justify-center"
            data-testid="add-property-btn"
          >
            <Building2 className="w-5 h-5" />
            Add Property
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Building2}
          label="Total Properties"
          value={loading ? '...' : stats?.property_count || 0}
          color="#00FFAB"
          delay={0.1}
        />
        <StatCard
          icon={PoundSterling}
          label="Portfolio Value"
          value={loading ? '...' : `£${((stats?.total_portfolio_value || 0) / 1000).toFixed(0)}k`}
          trend={12}
          color="#3B82F6"
          delay={0.2}
        />
        <StatCard
          icon={Leaf}
          label="Green Properties"
          value={loading ? '...' : stats?.green_properties || 0}
          color="#2DD4BF"
          delay={0.3}
        />
        <StatCard
          icon={AlertTriangle}
          label="Urgent Messages"
          value={loading ? '...' : stats?.urgent_messages || 0}
          color={stats?.urgent_messages > 0 ? '#EF4444' : '#00FFAB'}
          delay={0.4}
        />
      </div>

      {/* Sustainability Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* EPC Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-8 flex flex-col items-center"
        >
          <h3 className="text-lg font-semibold text-white mb-6 font-['Outfit']">Average EPC Score</h3>
          <div className="relative">
            <CircularProgress 
              value={loading ? 0 : stats?.average_epc_score || 0} 
              label={getEPCGrade(stats?.average_epc_score || 0)}
              color={stats?.average_epc_score >= 69 ? '#00FFAB' : stats?.average_epc_score >= 39 ? '#FBBF24' : '#EF4444'}
            />
          </div>
          <p className="text-slate-400 text-sm mt-6 text-center">
            {stats?.average_epc_score >= 69 
              ? '2028 compliant' 
              : 'Action required for 2028 compliance'}
          </p>
        </motion.div>

        {/* Compliance Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-8"
        >
          <h3 className="text-lg font-semibold text-white mb-6 font-['Outfit']">Compliance Status</h3>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
            stats?.compliance_status === 'Good' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-orange-500/20 text-orange-400'
          }`}>
            <Zap className="w-4 h-4" />
            {loading ? 'Loading...' : stats?.compliance_status || 'Unknown'}
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">EPC C+ Properties</span>
              <span className="text-white font-medium">{stats?.compliant_properties || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Needs Upgrade</span>
              <span className="text-white font-medium">{stats?.non_compliant_properties || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">2028 Deadline</span>
              <span className={`font-medium ${stats?.compliance_percentage >= 100 ? 'text-[#00FFAB]' : 'text-orange-400'}`}>
                {stats?.compliance_percentage >= 100 ? 'Ready' : 'Action Needed'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Compliance Score Widget */}
        <ComplianceScoreWidget stats={stats} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 font-['Outfit']">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            icon={Building2}
            title="Add New Property"
            description="List a new property in your portfolio"
            to="/dashboard/properties"
            delay={0.8}
          />
          <QuickActionCard
            icon={Leaf}
            title="HEM Calculator"
            description="Calculate energy upgrade ROI"
            to="/dashboard/sustainability"
            delay={0.9}
          />
          <QuickActionCard
            icon={MessageSquare}
            title="Tenant Messages"
            description={`${stats?.urgent_messages || 0} urgent messages`}
            to="/dashboard/chat"
            delay={1.0}
          />
        </div>
      </div>
    </div>
  );
};
