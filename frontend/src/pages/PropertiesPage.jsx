import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { authFetch } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Building2, 
  MapPin, 
  Bed, 
  Bath, 
  PoundSterling,
  Edit,
  Trash2,
  Leaf,
  Zap,
  UserPlus,
  UserMinus,
  Search,
  User
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EPC_RATINGS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const PROPERTY_TYPES = ['Flat', 'Terraced', 'Semi-Detached', 'Detached', 'Bungalow', 'Maisonette'];
const INSULATION_TYPES = ['None', 'Standard', 'Good', 'Excellent'];

// Property Card Component
const PropertyCard = ({ property, onEdit, onDelete, onAssignTenant, onUnassignTenant }) => {
  const epcColors = {
    A: 'bg-green-500',
    B: 'bg-green-400',
    C: 'bg-yellow-400',
    D: 'bg-yellow-500',
    E: 'bg-orange-500',
    F: 'bg-orange-600',
    G: 'bg-red-600'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass rounded-2xl overflow-hidden card-interactive"
    >
      {/* Image */}
      <div className="h-48 bg-[#112240] relative overflow-hidden">
        {property.images?.length > 0 ? (
          <img 
            src={property.images[0]} 
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-16 h-16 text-slate-600" />
          </div>
        )}
        <div className={`absolute top-4 right-4 w-10 h-10 rounded-full ${epcColors[property.epc_rating]} flex items-center justify-center font-bold text-black shadow-lg`}>
          {property.epc_rating}
        </div>
        <div className="absolute top-4 left-4 flex gap-2">
          {property.has_solar_panels && (
            <div className="w-8 h-8 rounded-full bg-[#00FFAB] flex items-center justify-center" title="Solar Panels">
              <Leaf className="w-4 h-4 text-black" />
            </div>
          )}
          {property.has_heat_pump && (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center" title="Heat Pump">
              <Zap className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-2 font-['Outfit'] line-clamp-1">{property.title}</h3>
        <p className="text-slate-400 text-sm flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4" />
          {property.city}, {property.postcode}
        </p>

        <div className="flex items-center gap-4 mb-4 text-slate-300">
          <span className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            {property.bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-4 h-4" />
            {property.bathrooms}
          </span>
          <span className="text-sm text-slate-500">{property.property_type}</span>
        </div>

        {/* Tenant Info */}
        {property.tenant_name ? (
          <div className="mb-4 p-3 rounded-xl bg-[#00FFAB]/10 border border-[#00FFAB]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#00FFAB]" />
                <div>
                  <p className="text-[#00FFAB] text-sm font-medium">{property.tenant_name}</p>
                  <p className="text-slate-400 text-xs">{property.tenant_email}</p>
                </div>
              </div>
              <button
                onClick={() => onUnassignTenant(property.property_id)}
                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                title="Unassign tenant"
                data-testid={`unassign-tenant-${property.property_id}`}
              >
                <UserMinus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onAssignTenant(property)}
            className="mb-4 w-full p-3 rounded-xl border border-dashed border-white/20 hover:border-[#00FFAB]/40 hover:bg-[#00FFAB]/5 transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-[#00FFAB]"
            data-testid={`assign-tenant-${property.property_id}`}
          >
            <UserPlus className="w-4 h-4" />
            <span className="text-sm">Assign Tenant</span>
          </button>
        )}

        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-[#00FFAB] flex items-center">
            <PoundSterling className="w-5 h-5" />
            {property.price.toLocaleString()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(property)}
              className="text-slate-400 hover:text-white hover:bg-white/10"
              data-testid={`edit-property-${property.property_id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(property.property_id)}
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              data-testid={`delete-property-${property.property_id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Property Form Component
const PropertyForm = ({ property, onSubmit, onClose }) => {
  const [formData, setFormData] = useState(property || {
    title: '',
    address: '',
    city: '',
    postcode: '',
    price: '',
    bedrooms: 2,
    bathrooms: 1,
    property_type: 'Flat',
    description: '',
    epc_rating: 'D',
    has_solar_panels: false,
    has_heat_pump: false,
    insulation_type: 'Standard',
    images: []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        price: parseFloat(formData.price)
      });
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="text-slate-300">Property Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Modern 2-bed flat in Shoreditch"
            required
            className="bg-[#0A192F]/50 border-white/10 text-white"
            data-testid="property-title-input"
          />
        </div>

        <div className="col-span-2">
          <Label className="text-slate-300">Address</Label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Example Street"
            required
            className="bg-[#0A192F]/50 border-white/10 text-white"
            data-testid="property-address-input"
          />
        </div>

        <div>
          <Label className="text-slate-300">City</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="London"
            required
            className="bg-[#0A192F]/50 border-white/10 text-white"
            data-testid="property-city-input"
          />
        </div>

        <div>
          <Label className="text-slate-300">Postcode</Label>
          <Input
            value={formData.postcode}
            onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
            placeholder="E1 6AN"
            required
            className="bg-[#0A192F]/50 border-white/10 text-white"
            data-testid="property-postcode-input"
          />
        </div>

        <div>
          <Label className="text-slate-300">Price (£)</Label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="450000"
            required
            className="bg-[#0A192F]/50 border-white/10 text-white"
            data-testid="property-price-input"
          />
        </div>

        <div>
          <Label className="text-slate-300">Property Type</Label>
          <Select
            value={formData.property_type}
            onValueChange={(value) => setFormData({ ...formData, property_type: value })}
          >
            <SelectTrigger className="bg-[#0A192F]/50 border-white/10 text-white" data-testid="property-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#112240] border-white/10">
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="text-white hover:bg-white/10">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-slate-300">Bedrooms</Label>
          <Input
            type="number"
            min="0"
            value={formData.bedrooms}
            onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
            className="bg-[#0A192F]/50 border-white/10 text-white"
            data-testid="property-bedrooms-input"
          />
        </div>

        <div>
          <Label className="text-slate-300">Bathrooms</Label>
          <Input
            type="number"
            min="0"
            value={formData.bathrooms}
            onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
            className="bg-[#0A192F]/50 border-white/10 text-white"
            data-testid="property-bathrooms-input"
          />
        </div>

        <div>
          <Label className="text-slate-300">EPC Rating</Label>
          <Select
            value={formData.epc_rating}
            onValueChange={(value) => setFormData({ ...formData, epc_rating: value })}
          >
            <SelectTrigger className="bg-[#0A192F]/50 border-white/10 text-white" data-testid="property-epc-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#112240] border-white/10">
              {EPC_RATINGS.map((rating) => (
                <SelectItem key={rating} value={rating} className="text-white hover:bg-white/10">
                  {rating}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-slate-300">Insulation Type</Label>
          <Select
            value={formData.insulation_type}
            onValueChange={(value) => setFormData({ ...formData, insulation_type: value })}
          >
            <SelectTrigger className="bg-[#0A192F]/50 border-white/10 text-white" data-testid="property-insulation-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#112240] border-white/10">
              {INSULATION_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="text-white hover:bg-white/10">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label className="text-slate-300">Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the property..."
            rows={3}
            className="bg-[#0A192F]/50 border-white/10 text-white resize-none"
            data-testid="property-description-input"
          />
        </div>

        {/* Green Features */}
        <div className="col-span-2 flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.has_solar_panels}
              onChange={(e) => setFormData({ ...formData, has_solar_panels: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-[#0A192F]/50 text-[#00FFAB] focus:ring-[#00FFAB]"
              data-testid="property-solar-checkbox"
            />
            <span className="text-slate-300 flex items-center gap-1">
              <Leaf className="w-4 h-4 text-[#00FFAB]" />
              Solar Panels
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.has_heat_pump}
              onChange={(e) => setFormData({ ...formData, has_heat_pump: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-[#0A192F]/50 text-blue-500 focus:ring-blue-500"
              data-testid="property-heatpump-checkbox"
            />
            <span className="text-slate-300 flex items-center gap-1">
              <Zap className="w-4 h-4 text-blue-500" />
              Heat Pump
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="btn-secondary py-2 px-4"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="btn-primary py-2 px-6"
          data-testid="property-submit-btn"
        >
          {loading ? 'Saving...' : property ? 'Update Property' : 'Add Property'}
        </Button>
      </div>
    </form>
  );
};

export const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningProperty, setAssigningProperty] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchProperties = async () => {
    try {
      const response = await authFetch(`${API_URL}/api/properties`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleCreateProperty = async (propertyData) => {
    const response = await authFetch(`${API_URL}/api/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(propertyData),
    });

    if (!response.ok) {
      throw new Error('Failed to create property');
    }

    toast.success('Property added successfully!');
    fetchProperties();
  };

  const handleUpdateProperty = async (propertyData) => {
    const response = await authFetch(`${API_URL}/api/properties/${editingProperty.property_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(propertyData),
    });

    if (!response.ok) {
      throw new Error('Failed to update property');
    }

    toast.success('Property updated successfully!');
    setEditingProperty(null);
    fetchProperties();
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;

    try {
      const response = await authFetch(`${API_URL}/api/properties/${propertyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Property deleted successfully!');
        fetchProperties();
      } else {
        throw new Error('Failed to delete property');
      }
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const openEditDialog = (property) => {
    setEditingProperty(property);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingProperty(null);
  };

  // Tenant assignment
  const openAssignDialog = (property) => {
    setAssigningProperty(property);
    setSearchEmail('');
    setSearchResults([]);
    setAssignDialogOpen(true);
  };

  const handleSearchTenants = useCallback(async (email) => {
    if (email.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await authFetch(`${API_URL}/api/tenants/search?email=${encodeURIComponent(email)}`);
      if (res.ok) setSearchResults(await res.json());
    } catch {} finally { setSearchLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchEmail) handleSearchTenants(searchEmail);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchEmail, handleSearchTenants]);

  const handleAssignTenant = async (tenantEmail) => {
    if (!assigningProperty) return;
    setAssigning(true);
    try {
      const res = await authFetch(`${API_URL}/api/properties/${assigningProperty.property_id}/assign-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_email: tenantEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        setAssignDialogOpen(false);
        fetchProperties();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to assign tenant');
      }
    } catch { toast.error('Failed to assign tenant'); }
    finally { setAssigning(false); }
  };

  const handleUnassignTenant = async (propertyId) => {
    if (!window.confirm('Remove this tenant from the property?')) return;
    try {
      const res = await authFetch(`${API_URL}/api/properties/${propertyId}/unassign-tenant`, { method: 'POST' });
      if (res.ok) {
        toast.success('Tenant unassigned');
        fetchProperties();
      }
    } catch { toast.error('Failed to unassign tenant'); }
  };

  return (
    <div className="space-y-8" data-testid="properties-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">Properties</h1>
          <p className="text-slate-400 mt-1">Manage your property portfolio</p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="btn-primary"
          data-testid="add-property-btn"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl h-80 animate-pulse">
              <div className="h-48 bg-white/5" />
              <div className="p-6 space-y-3">
                <div className="h-6 bg-white/5 rounded w-3/4" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No properties yet</h3>
          <p className="text-slate-400 mb-6">Add your first property to get started</p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Property
          </Button>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {properties.map((property) => (
              <PropertyCard
                key={property.property_id}
                property={property}
                onEdit={openEditDialog}
                onDelete={handleDeleteProperty}
                onAssignTenant={openAssignDialog}
                onUnassignTenant={handleUnassignTenant}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="glass border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white font-['Outfit']">
              {editingProperty ? 'Edit Property' : 'Add New Property'}
            </DialogTitle>
          </DialogHeader>
          <PropertyForm
            property={editingProperty}
            onSubmit={editingProperty ? handleUpdateProperty : handleCreateProperty}
            onClose={closeDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Assign Tenant Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="glass border-white/10 max-w-md backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white font-['Outfit']">
              Assign Tenant
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Search for a registered tenant by email to assign to{' '}
              <span className="text-[#00FFAB]">{assigningProperty?.title}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Search by email..."
                className="pl-10 bg-[#0A192F]/50 border-white/10 text-white placeholder:text-slate-500"
                data-testid="assign-tenant-search"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchLoading ? (
                <div className="text-center py-4 text-slate-400 text-sm">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((tenant) => (
                  <button
                    key={tenant.user_id}
                    onClick={() => handleAssignTenant(tenant.email)}
                    disabled={assigning}
                    className="w-full p-3 rounded-xl bg-white/5 hover:bg-[#00FFAB]/10 hover:border-[#00FFAB]/30 border border-transparent transition-all flex items-center gap-3 text-left"
                    data-testid={`assign-result-${tenant.user_id}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#00FFAB]/20 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-[#00FFAB]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{tenant.name}</p>
                      <p className="text-slate-400 text-xs truncate">{tenant.email}</p>
                    </div>
                    <UserPlus className="w-4 h-4 text-[#00FFAB] shrink-0" />
                  </button>
                ))
              ) : searchEmail.length >= 2 ? (
                <div className="text-center py-4 text-slate-500 text-sm">
                  No tenants found matching "{searchEmail}"
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">
                  Type at least 2 characters to search
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
