import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authFetch } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Leaf, 
  Zap, 
  Calculator, 
  TrendingUp, 
  PoundSterling,
  Home,
  Thermometer,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Animated Circular Progress for EPC
const EPCProgressRing = ({ rating, score }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const circumference = 2 * Math.PI * 70;
  const progress = (animatedScore / 100) * circumference;

  const epcColors = {
    A: '#22C55E',
    B: '#4ADE80',
    C: '#FACC15',
    D: '#F59E0B',
    E: '#F97316',
    F: '#EA580C',
    G: '#DC2626'
  };

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative w-48 h-48">
      <svg width="192" height="192" className="transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r="70"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
        />
        <circle
          cx="96"
          cy="96"
          r="70"
          fill="none"
          stroke={epcColors[rating]}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="progress-circle"
          style={{ filter: `drop-shadow(0 0 12px ${epcColors[rating]}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-white">{rating}</span>
        <span className="text-slate-400 text-sm">EPC Rating</span>
        <span className="text-[#00FFAB] text-lg font-semibold mt-1">{Math.round(animatedScore)}/100</span>
      </div>
    </div>
  );
};

// HEM Calculator Form
const HEMCalculator = ({ onCalculate, loading }) => {
  const [formData, setFormData] = useState({
    current_epc: 'D',
    property_type: 'Semi-Detached',
    floor_area_sqm: 80,
    has_gas_heating: true,
    current_insulation: 'Standard',
    region: 'England'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCalculate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-300">Current EPC Rating</Label>
          <Select
            value={formData.current_epc}
            onValueChange={(value) => setFormData({ ...formData, current_epc: value })}
          >
            <SelectTrigger className="bg-[#0A192F]/50 border-white/10 text-white" data-testid="hem-epc-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#112240] border-white/10">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((rating) => (
                <SelectItem key={rating} value={rating} className="text-white hover:bg-white/10">
                  {rating}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-slate-300">Property Type</Label>
          <Select
            value={formData.property_type}
            onValueChange={(value) => setFormData({ ...formData, property_type: value })}
          >
            <SelectTrigger className="bg-[#0A192F]/50 border-white/10 text-white" data-testid="hem-property-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#112240] border-white/10">
              {['Flat', 'Terraced', 'Semi-Detached', 'Detached', 'Bungalow'].map((type) => (
                <SelectItem key={type} value={type} className="text-white hover:bg-white/10">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-slate-300">Floor Area (sqm)</Label>
          <Input
            type="number"
            value={formData.floor_area_sqm}
            onChange={(e) => setFormData({ ...formData, floor_area_sqm: parseFloat(e.target.value) })}
            className="bg-[#0A192F]/50 border-white/10 text-white"
            data-testid="hem-floor-area-input"
          />
        </div>

        <div>
          <Label className="text-slate-300">Insulation Quality</Label>
          <Select
            value={formData.current_insulation}
            onValueChange={(value) => setFormData({ ...formData, current_insulation: value })}
          >
            <SelectTrigger className="bg-[#0A192F]/50 border-white/10 text-white" data-testid="hem-insulation-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#112240] border-white/10">
              {['None', 'Standard', 'Good', 'Excellent'].map((type) => (
                <SelectItem key={type} value={type} className="text-white hover:bg-white/10">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.has_gas_heating}
              onChange={(e) => setFormData({ ...formData, has_gas_heating: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-[#0A192F]/50 text-[#00FFAB] focus:ring-[#00FFAB]"
              data-testid="hem-gas-checkbox"
            />
            <span className="text-slate-300">Currently using gas heating</span>
          </label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full btn-primary"
        data-testid="hem-calculate-btn"
      >
        {loading ? 'Calculating...' : 'Calculate HEM Score'}
        <Calculator className="w-5 h-5 ml-2" />
      </Button>
    </form>
  );
};

// Results Card
const ResultCard = ({ icon: Icon, title, value, subtitle, color = '#00FFAB' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass rounded-xl p-6"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-slate-400 text-sm">{title}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  </motion.div>
);

export const SustainabilityPage = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async (formData) => {
    setLoading(true);
    try {
      const response = await authFetch(`${API_URL}/api/sustainability/hem-calculator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        toast.success('HEM calculation complete!');
      } else {
        throw new Error('Calculation failed');
      }
    } catch (error) {
      toast.error('Failed to calculate HEM score');
    } finally {
      setLoading(false);
    }
  };

  // Sample chart data for energy savings projection
  const savingsData = results ? [
    { year: 'Year 1', savings: results.annual_energy_savings_gbp * 0.5, cumulative: results.annual_energy_savings_gbp * 0.5 },
    { year: 'Year 2', savings: results.annual_energy_savings_gbp, cumulative: results.annual_energy_savings_gbp * 1.5 },
    { year: 'Year 3', savings: results.annual_energy_savings_gbp, cumulative: results.annual_energy_savings_gbp * 2.5 },
    { year: 'Year 4', savings: results.annual_energy_savings_gbp, cumulative: results.annual_energy_savings_gbp * 3.5 },
    { year: 'Year 5', savings: results.annual_energy_savings_gbp, cumulative: results.annual_energy_savings_gbp * 4.5 },
  ] : [];

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
    <div className="space-y-8" data-testid="sustainability-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white font-['Outfit']">Sustainability Tracker</h1>
        <p className="text-slate-400 mt-1">Calculate your property's HEM score and energy upgrade ROI</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calculator Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-2xl p-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#00FFAB]/20 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-[#00FFAB]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white font-['Outfit']">HEM Calculator</h2>
              <p className="text-slate-400 text-sm">Home Energy Model Transition Estimator</p>
            </div>
          </div>
          <HEMCalculator onCalculate={handleCalculate} loading={loading} />
        </motion.div>

        {/* Results Preview */}
        {results ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-8 flex flex-col items-center justify-center"
          >
            <h3 className="text-lg font-semibold text-white mb-6">Your HEM Score</h3>
            <div className="flex gap-8 items-center">
              <div className="text-center">
                <EPCProgressRing 
                  rating={getEPCGrade(results.current_hem_score)} 
                  score={results.current_hem_score} 
                />
                <p className="text-slate-400 mt-4">Current</p>
              </div>
              <ArrowRight className="w-8 h-8 text-[#00FFAB]" />
              <div className="text-center">
                <EPCProgressRing 
                  rating={getEPCGrade(results.projected_hem_score)} 
                  score={results.projected_hem_score} 
                />
                <p className="text-slate-400 mt-4">Projected</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-8 flex flex-col items-center justify-center"
          >
            <Leaf className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Calculate Your HEM Score</h3>
            <p className="text-slate-400 text-center max-w-sm">
              Enter your property details to see your current Home Energy Model score and 
              projected improvements with upgrades.
            </p>
          </motion.div>
        )}
      </div>

      {/* Results Section */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Key Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ResultCard
              icon={Zap}
              title="Heat Pump ROI"
              value={`${results.heat_pump_roi_years} years`}
              subtitle="Payback period"
              color="#3B82F6"
            />
            <ResultCard
              icon={Thermometer}
              title="Insulation ROI"
              value={`${results.insulation_roi_years} years`}
              subtitle="Payback period"
              color="#F472B6"
            />
            <ResultCard
              icon={PoundSterling}
              title="Annual Savings"
              value={`£${results.annual_energy_savings_gbp.toLocaleString()}`}
              subtitle="Estimated energy savings"
              color="#00FFAB"
            />
            <ResultCard
              icon={Leaf}
              title="Carbon Reduction"
              value={`${results.carbon_reduction_kg.toLocaleString()} kg`}
              subtitle="CO2 per year"
              color="#2DD4BF"
            />
          </div>

          {/* Charts and Recommendations */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Savings Chart */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6 font-['Outfit']">Cumulative Savings Projection</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsData}>
                    <defs>
                      <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FFAB" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00FFAB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="year" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(v) => `£${v}`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#112240', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value) => [`£${value.toLocaleString()}`, 'Savings']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#00FFAB" 
                      fill="url(#savingsGradient)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6 font-['Outfit']">Recommendations</h3>
              <div className="space-y-4">
                {results.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white/5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#00FFAB]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Lightbulb className="w-4 h-4 text-[#00FFAB]" />
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{rec}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* 2028 Compliance Warning */}
          {results.current_hem_score < 69 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-orange-500/20 border border-orange-500/30 rounded-2xl p-6 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                <Home className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h4 className="text-orange-400 font-semibold mb-1">2028 EPC Compliance Alert</h4>
                <p className="text-slate-300 text-sm">
                  Your property currently falls below the EPC C minimum requirement coming into effect in 2028. 
                  Consider the recommended upgrades to avoid potential fines of up to £30,000.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};
