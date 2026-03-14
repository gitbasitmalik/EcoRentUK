import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authFetch } from '@/context/AuthContext';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  MessageSquare,
  Building2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Lead Card Component
const LeadCard = ({ lead, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass rounded-2xl p-6 card-interactive"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#00FFAB]/20 flex items-center justify-center">
          <span className="text-[#00FFAB] font-bold text-lg">
            {lead.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-white font-semibold">{lead.name}</h3>
          <p className="text-slate-400 text-sm flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(lead.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>
      {lead.property_interest && (
        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {lead.property_interest}
        </span>
      )}
    </div>

    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-2 text-slate-300">
        <Mail className="w-4 h-4 text-[#00FFAB]" />
        <a href={`mailto:${lead.email}`} className="hover:text-[#00FFAB] transition-colors">
          {lead.email}
        </a>
      </div>
      {lead.phone && (
        <div className="flex items-center gap-2 text-slate-300">
          <Phone className="w-4 h-4 text-[#00FFAB]" />
          <a href={`tel:${lead.phone}`} className="hover:text-[#00FFAB] transition-colors">
            {lead.phone}
          </a>
        </div>
      )}
    </div>

    <div className="pt-4 border-t border-white/10">
      <div className="flex items-start gap-2">
        <MessageSquare className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-slate-400 text-sm line-clamp-3">{lead.message}</p>
      </div>
    </div>
  </motion.div>
);

export const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await authFetch(`${API_URL}/api/leads`);
        if (response.ok) {
          const data = await response.json();
          setLeads(data);
        }
      } catch (error) {
        console.error('Failed to fetch leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  return (
    <div className="space-y-8" data-testid="leads-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">Leads</h1>
          <p className="text-slate-400 mt-1">Manage enquiries from potential tenants and buyers</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FFAB]/10 border border-[#00FFAB]/30">
          <Users className="w-5 h-5 text-[#00FFAB]" />
          <span className="text-[#00FFAB] font-semibold">{leads.length} Total Leads</span>
        </div>
      </div>

      {/* Leads Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl h-64 animate-pulse">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/5" />
                  <div className="space-y-2">
                    <div className="h-4 bg-white/5 rounded w-24" />
                    <div className="h-3 bg-white/5 rounded w-16" />
                  </div>
                </div>
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No leads yet</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            When visitors submit the lead capture form on your landing page, 
            their enquiries will appear here.
          </p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead, index) => (
            <LeadCard key={lead.lead_id} lead={lead} delay={index * 0.1} />
          ))}
        </div>
      )}
    </div>
  );
};
