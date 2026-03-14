import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, authFetch } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  MessageSquare, 
  FileText, 
  MapPin, 
  Bed, 
  Bath, 
  Leaf,
  User,
  Download,
  Building2,
  ArrowRight
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Tab = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
      active 
        ? 'bg-[#00FFAB] text-black' 
        : 'bg-white/5 text-slate-300 hover:bg-white/10'
    }`}
    data-testid={`tenant-tab-${label.toLowerCase().replace(' ', '-')}`}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </button>
);

const MyHomeTab = ({ homeData }) => {
  if (!homeData?.has_property) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 text-center"
        data-testid="tenant-no-property"
      >
        <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Property Assigned</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          You haven't been assigned to a property yet. Please contact your landlord 
          or property manager to get set up.
        </p>
      </motion.div>
    );
  }

  const { property, landlord } = homeData;
  const epcColors = {
    A: 'bg-green-500', B: 'bg-green-400', C: 'bg-yellow-400',
    D: 'bg-yellow-500', E: 'bg-orange-500', F: 'bg-orange-600', G: 'bg-red-600'
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="glass rounded-2xl p-6" data-testid="tenant-property-card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2 font-['Outfit']">{property.title || 'Your Home'}</h3>
            <p className="text-slate-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {property.address}, {property.city}, {property.postcode}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl ${epcColors[property.epc_rating]} flex items-center justify-center font-bold text-black text-xl`}>
            {property.epc_rating}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <Bed className="w-6 h-6 text-[#00FFAB] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{property.bedrooms}</p>
            <p className="text-slate-400 text-sm">Bedrooms</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <Bath className="w-6 h-6 text-[#00FFAB] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{property.bathrooms}</p>
            <p className="text-slate-400 text-sm">Bathrooms</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <Home className="w-6 h-6 text-[#00FFAB] mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{property.property_type}</p>
            <p className="text-slate-400 text-sm">Type</p>
          </div>
        </div>

        <div className={`rounded-xl p-4 ${
          ['A', 'B', 'C'].includes(property.epc_rating) 
            ? 'bg-green-500/10 border border-green-500/20' 
            : 'bg-orange-500/10 border border-orange-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <Leaf className={`w-5 h-5 ${
              ['A', 'B', 'C'].includes(property.epc_rating) ? 'text-green-400' : 'text-orange-400'
            }`} />
            <div>
              <p className={`font-medium ${
                ['A', 'B', 'C'].includes(property.epc_rating) ? 'text-green-400' : 'text-orange-400'
              }`}>EPC Rating {property.epc_rating}</p>
              <p className="text-slate-400 text-sm">
                {['A', 'B', 'C'].includes(property.epc_rating) 
                  ? 'Your home is energy efficient!'
                  : 'Your home could benefit from energy improvements'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {landlord && (
        <div className="glass rounded-2xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Your Landlord</h4>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#00FFAB]/20 flex items-center justify-center">
              <User className="w-6 h-6 text-[#00FFAB]" />
            </div>
            <div>
              <p className="text-white font-medium">{landlord.name}</p>
              <p className="text-slate-400 text-sm">{landlord.email}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const QuickChatTab = () => {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 text-center">
      <MessageSquare className="w-16 h-16 text-[#00FFAB] mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">Message Your Landlord</h3>
      <p className="text-slate-400 max-w-md mx-auto mb-6">
        Send messages, report issues, and communicate directly with your landlord through our messaging system.
      </p>
      <Button onClick={() => navigate('/tenant/chat')} className="btn-primary" data-testid="go-to-chat-btn">
        Open Messages <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
};

const DocumentsTab = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await authFetch(`${API_URL}/api/tenant/documents`);
        if (response.ok) {
          const data = await response.json();
          setDocuments(data.documents || []);
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  if (loading) {
    return <div className="glass rounded-2xl p-8 text-center"><div className="text-slate-400">Loading documents...</div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
      <h3 className="text-xl font-semibold text-white mb-6 font-['Outfit']">Your Documents</h3>
      {documents.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No documents available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#00FFAB]/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#00FFAB]" />
                </div>
                <div>
                  <p className="text-white font-medium">{doc.name}</p>
                  <p className="text-slate-400 text-sm">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString('en-GB')}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-[#00FFAB] hover:bg-[#00FFAB]/10">
                <Download className="w-4 h-4 mr-2" />Download
              </Button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export const TenantDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await authFetch(`${API_URL}/api/tenant/my-home`);
        if (response.ok) {
          const data = await response.json();
          setHomeData(data);
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#00FFAB] text-lg">Loading...</div></div>;
  }

  return (
    <div className="space-y-6" data-testid="tenant-dashboard">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-white font-['Outfit']">
          Welcome, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-slate-400 mt-1">Manage your tenancy and communicate with your landlord</p>
      </motion.div>

      <div className="flex flex-wrap gap-3">
        <Tab active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={Home} label="My Home" />
        <Tab active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} icon={MessageSquare} label="Messages" />
        <Tab active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={FileText} label="Documents" />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'home' && <MyHomeTab key="home" homeData={homeData} />}
        {activeTab === 'messages' && <QuickChatTab key="messages" />}
        {activeTab === 'documents' && <DocumentsTab key="documents" />}
      </AnimatePresence>
    </div>
  );
};
