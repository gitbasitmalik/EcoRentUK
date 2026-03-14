import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Leaf, 
  Building2, 
  LineChart, 
  MessageSquare, 
  Shield, 
  Zap,
  ArrowRight,
  Check,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// 3D Glass Card with mouse tracking
const Hero3DCard = () => {
  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className="relative w-full max-w-lg mx-auto perspective-1000"
    >
      <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20 transform-gpu">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#00FFAB]/10 to-transparent" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#00FFAB] flex items-center justify-center glow-mint">
              <Leaf className="w-8 h-8 text-black" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white font-['Outfit']">EcoRent UK</h3>
              <p className="text-slate-400">Sustainable Property Management</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-bold text-[#00FFAB]">A+</p>
              <p className="text-sm text-slate-400">Average EPC Rating</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-bold text-white">£2.4M</p>
              <p className="text-sm text-slate-400">Portfolio Value</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#00FFAB]">
            <Check className="w-5 h-5" />
            <span className="text-sm">2028 EPC Compliant Ready</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Scroll Storytelling Section
const ScrollStorySection = ({ children, index }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [100, 0, 0, -100]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      className="py-20"
    >
      {children}
    </motion.div>
  );
};

// Feature Card
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="glass rounded-2xl p-6 card-interactive"
  >
    <div className="w-12 h-12 rounded-xl bg-[#00FFAB]/20 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-[#00FFAB]" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-2 font-['Outfit']">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{description}</p>
  </motion.div>
);

// Lead Capture Form
const LeadCaptureForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    property_interest: 'General Inquiry'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Thank you! We\'ll be in touch shortly.');
        setFormData({ name: '', email: '', phone: '', message: '', property_interest: 'General Inquiry' });
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Your name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        className="bg-[#0A192F]/50 border-white/10 text-white placeholder:text-slate-500"
        data-testid="lead-name-input"
      />
      <Input
        type="email"
        placeholder="Email address"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        className="bg-[#0A192F]/50 border-white/10 text-white placeholder:text-slate-500"
        data-testid="lead-email-input"
      />
      <Input
        type="tel"
        placeholder="Phone number (optional)"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="bg-[#0A192F]/50 border-white/10 text-white placeholder:text-slate-500"
        data-testid="lead-phone-input"
      />
      <Textarea
        placeholder="Tell us about your property needs..."
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        required
        rows={4}
        className="bg-[#0A192F]/50 border-white/10 text-white placeholder:text-slate-500 resize-none"
        data-testid="lead-message-input"
      />
      <Button
        type="submit"
        disabled={loading}
        className="w-full btn-primary"
        data-testid="lead-submit-btn"
      >
        {loading ? 'Sending...' : 'Request Free EPC Audit'}
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </form>
  );
};

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A192F] bg-grid-pattern">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-heavy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00FFAB] flex items-center justify-center">
                <Leaf className="w-6 h-6 text-black" />
              </div>
              <span className="font-bold text-xl text-white font-['Outfit']">EcoRent UK</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">How It Works</a>
              <a href="#regulations" className="text-slate-300 hover:text-white transition-colors">Regulations</a>
              <a href="#contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white" data-testid="nav-login-btn">
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="btn-primary py-2 px-6" data-testid="nav-signup-btn">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-20 hero-glow overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FFAB]/10 border border-[#00FFAB]/30 text-[#00FFAB] text-sm font-medium mb-6"
              >
                <Zap className="w-4 h-4" />
                2028 EPC Regulations Ready
              </motion.span>

              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight font-['Outfit']">
                Sustainable
                <br />
                <span className="gradient-text">Property</span>
                <br />
                Management
              </h1>

              <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-lg">
                The intelligent platform for UK landlords to manage properties, 
                track sustainability metrics, and stay compliant with upcoming regulations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => navigate('/register')}
                  className="btn-primary"
                  data-testid="hero-get-started-btn"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                  variant="outline"
                  className="btn-secondary"
                  data-testid="hero-learn-more-btn"
                >
                  See How It Works
                </Button>
              </div>

              <div className="mt-12 flex items-center gap-8">
                <div>
                  <p className="text-3xl font-bold text-white">500+</p>
                  <p className="text-slate-400">Properties Managed</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                  <p className="text-3xl font-bold text-white">98%</p>
                  <p className="text-slate-400">Compliance Rate</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                  <p className="text-3xl font-bold text-[#00FFAB]">£1.2M</p>
                  <p className="text-slate-400">Saved in Fines</p>
                </div>
              </div>
            </motion.div>

            {/* Right - 3D Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Hero3DCard />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col items-center text-slate-400"
          >
            <span className="text-sm mb-2">Scroll to explore</span>
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[#00FFAB] text-sm font-semibold uppercase tracking-widest">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6 font-['Outfit']">
              Everything You Need to Manage
              <br />
              <span className="gradient-text">Sustainable Properties</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              From EPC tracking to tenant communication, we've got you covered.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Building2}
              title="Property Portfolio"
              description="Manage all your properties in one place with comprehensive details, documents, and performance metrics."
              delay={0.1}
            />
            <FeatureCard
              icon={Leaf}
              title="Sustainability Tracker"
              description="Monitor EPC ratings, HEM scores, and track your portfolio's environmental impact with real-time analytics."
              delay={0.2}
            />
            <FeatureCard
              icon={LineChart}
              title="HEM Calculator"
              description="Calculate the ROI of energy upgrades like heat pumps and insulation with our Home Energy Model tool."
              delay={0.3}
            />
            <FeatureCard
              icon={MessageSquare}
              title="AI Tenant Chat"
              description="Intelligent chat system that automatically categorises tenant requests as urgent, standard, or inquiry."
              delay={0.4}
            />
            <FeatureCard
              icon={Shield}
              title="Compliance Dashboard"
              description="Stay ahead of Section 21 and EPC regulations with automated alerts and compliance tracking."
              delay={0.5}
            />
            <FeatureCard
              icon={Zap}
              title="Lead Capture"
              description="Capture and manage leads with instant email notifications and follow-up automation."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* How It Works - Scroll Storytelling */}
      <section id="how-it-works" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[#00FFAB] text-sm font-semibold uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 font-['Outfit']">
              Your Journey to
              <span className="gradient-text"> Sustainable Letting</span>
            </h2>
          </motion.div>

          <div className="space-y-8">
            <ScrollStorySection index={0}>
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="text-[#00FFAB] text-sm font-semibold mb-4">STEP 01</div>
                  <h3 className="text-3xl font-bold text-white mb-4 font-['Outfit']">Add Your Properties</h3>
                  <p className="text-slate-400 text-lg leading-relaxed mb-6">
                    Import your property portfolio with details including EPC ratings, 
                    energy features, and tenant information. Our system automatically 
                    calculates HEM scores based on current UK metrics.
                  </p>
                  <ul className="space-y-3">
                    {['Bulk import support', 'EPC certificate scanning', 'Automatic HEM calculation'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300">
                        <Check className="w-5 h-5 text-[#00FFAB]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass rounded-2xl p-8 h-80 flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1761158497156-c8f202a07b42?w=600&q=80" 
                    alt="Modern UK property"
                    className="rounded-xl object-cover w-full h-full"
                  />
                </div>
              </div>
            </ScrollStorySection>

            <ScrollStorySection index={1}>
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1 glass rounded-2xl p-8 h-80 flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1756542713155-94f62d47d1b5?w=600&q=80" 
                    alt="Solar panels on residential roof"
                    className="rounded-xl object-cover w-full h-full"
                  />
                </div>
                <div className="order-1 lg:order-2">
                  <div className="text-[#00FFAB] text-sm font-semibold mb-4">STEP 02</div>
                  <h3 className="text-3xl font-bold text-white mb-4 font-['Outfit']">Track Sustainability</h3>
                  <p className="text-slate-400 text-lg leading-relaxed mb-6">
                    Monitor your portfolio's energy efficiency with our comprehensive 
                    sustainability dashboard. See which properties need attention 
                    before the 2028 EPC C minimum requirement.
                  </p>
                  <ul className="space-y-3">
                    {['Real-time EPC monitoring', 'Carbon footprint tracking', '2028 compliance alerts'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300">
                        <Check className="w-5 h-5 text-[#00FFAB]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollStorySection>

            <ScrollStorySection index={2}>
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="text-[#00FFAB] text-sm font-semibold mb-4">STEP 03</div>
                  <h3 className="text-3xl font-bold text-white mb-4 font-['Outfit']">Optimise & Grow</h3>
                  <p className="text-slate-400 text-lg leading-relaxed mb-6">
                    Use our HEM calculator to identify the best upgrades for your 
                    properties. Calculate ROI for heat pumps, insulation, and solar 
                    panels to make data-driven investment decisions.
                  </p>
                  <ul className="space-y-3">
                    {['Heat pump ROI calculator', 'Insulation upgrade planner', 'Grant eligibility checker'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300">
                        <Check className="w-5 h-5 text-[#00FFAB]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass rounded-2xl p-8 h-80 flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1758873269317-51888e824b28?w=600&q=80" 
                    alt="Team collaboration"
                    className="rounded-xl object-cover w-full h-full"
                  />
                </div>
              </div>
            </ScrollStorySection>
          </div>
        </div>
      </section>

      {/* UK Regulations Section */}
      <section id="regulations" className="py-32 relative bg-[#112240]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[#00FFAB] text-sm font-semibold uppercase tracking-widest">UK Regulations</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6 font-['Outfit']">
              Stay Compliant with
              <span className="gradient-text"> UK Property Law</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Section 21 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold text-white font-['Outfit']">Section 21 Updates</h3>
              </div>
              <p className="text-slate-400 mb-6 leading-relaxed">
                The Renters' Reform Bill is set to abolish Section 21 "no-fault" evictions. 
                Stay informed about the transition period and new grounds for possession.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-[#00FFAB]" />
                  <span>New possession grounds explained</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-[#00FFAB]" />
                  <span>Timeline for implementation</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-[#00FFAB]" />
                  <span>Landlord protection measures</span>
                </li>
              </ul>
              <a 
                href="https://www.gov.uk/government/publications/renters-reform-bill" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#00FFAB] hover:underline"
              >
                Read Government Guidance
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>

            {/* EPC Regulations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white font-['Outfit']">EPC Regulation Changes</h3>
              </div>
              <p className="text-slate-400 mb-6 leading-relaxed">
                From 2028, all rental properties in England and Wales must have a minimum 
                EPC rating of C. Non-compliance can result in fines up to £30,000.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-[#00FFAB]" />
                  <span>EPC C minimum by 2028</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-[#00FFAB]" />
                  <span>Fines up to £30,000 per property</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-[#00FFAB]" />
                  <span>Government grants available</span>
                </li>
              </ul>
              <a 
                href="https://www.gov.uk/government/consultations/improving-the-energy-performance-of-privately-rented-homes" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#00FFAB] hover:underline"
              >
                Check EPC Requirements
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          </div>

          {/* Compliance Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 glass rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold text-white mb-8 text-center font-['Outfit']">Compliance Timeline</h3>
            <div className="flex flex-wrap justify-center gap-8">
              {[
                { year: '2025', event: 'New EPC assessments required for new tenancies', status: 'active' },
                { year: '2026', event: 'Section 21 abolition takes effect', status: 'upcoming' },
                { year: '2028', event: 'EPC C minimum for all rentals', status: 'upcoming' },
                { year: '2030', event: 'EPC B target for new builds', status: 'future' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 ${
                    item.status === 'active' ? 'bg-[#00FFAB] text-black' : 
                    item.status === 'upcoming' ? 'bg-orange-500/20 text-orange-400 border-2 border-orange-500/50' :
                    'bg-white/5 text-slate-400 border border-white/10'
                  }`}>
                    <span className="text-xl font-bold">{item.year}</span>
                  </div>
                  <p className="text-sm text-slate-400 max-w-32">{item.event}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact / Lead Capture Section */}
      <section id="contact" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-[#00FFAB] text-sm font-semibold uppercase tracking-widest">Get Started</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6 font-['Outfit']">
                Request Your Free
                <span className="gradient-text"> EPC Audit</span>
              </h2>
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                Let our experts analyse your portfolio and provide personalised 
                recommendations for improving your properties' energy efficiency.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#00FFAB]/20 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#00FFAB]" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Email us</p>
                    <p className="text-white font-medium">hello@ecorent.uk</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#00FFAB]/20 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-[#00FFAB]" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Call us</p>
                    <p className="text-white font-medium">020 7946 0958</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#00FFAB]/20 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[#00FFAB]" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Visit us</p>
                    <p className="text-white font-medium">71-75 Shelton Street, London WC2H 9JQ</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6 font-['Outfit']">Get in Touch</h3>
              <LeadCaptureForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00FFAB] flex items-center justify-center">
                <Leaf className="w-6 h-6 text-black" />
              </div>
              <span className="font-bold text-xl text-white font-['Outfit']">EcoRent UK</span>
            </div>

            <div className="flex items-center gap-8 text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>

            <p className="text-slate-500 text-sm">
              © 2026 EcoRent UK. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
