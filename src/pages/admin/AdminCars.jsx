// src/pages/admin/AdminCars.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCars, createCar, updateCar, deleteCar, selectCars, selectCarsLoading, fetchMatricules, selectMatricules } from "../../Redux/store";
import PaginationControls from '../../components/PaginationControls';
import { toast } from "sonner";
import { 
  Plus, Edit2, Trash2, X, Search, RefreshCw, Car, Palette, DollarSign, 
  ChevronLeft, ChevronRight, Calendar, Gauge, Fuel, Settings, Users, 
  DoorOpen, AlertTriangle, CheckCircle, XCircle, Image as ImageIcon,
  Upload, Save, Ban, TrashIcon, CarFront, Grid3x3, List, LayoutGrid,
  CheckCircle2, AlertCircle, Shield, Wrench, CalendarCheck, Sparkles,
  Star, Gem, Award, Heart, Zap, ArrowUpDown, ArrowUp, ArrowDown,
  Info, Crown, Briefcase, Activity, Clock, Key, Lock, Unlock,
  Bell, Globe, PlusCircle 
} from "lucide-react";
import { getImageUrl } from '../../utils/imageUtils';

export default function AdminCars() {
  const dispatch = useDispatch();
  const cars = useSelector(selectCars);
  const matricules = useSelector(selectMatricules);
  const loading = useSelector(selectCarsLoading);
  
  const [showCarForm, setShowCarForm] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState(null);
  const [editingCar, setEditingCar] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [imagePreview, setImagePreview] = useState('');
  const [viewMode, setViewMode] = useState('list');
  
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");
  
  const [listItemsPerPage, setListItemsPerPage] = useState(10);
  const [cardsItemsPerPage, setCardsItemsPerPage] = useState(12);
  
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    fuel_type: "petrol",
    transmission: "manual",
    seats: 5,
    doors: 4,
    price_per_day: 100,
    image: "",
    status: "disponible",
    is_featured: false,
  });

  useEffect(() => { 
    dispatch(fetchCars()); 
    dispatch(fetchMatricules());
  }, [dispatch]);

  const getCarRealStatus = (carId) => {
    const carMatricules = matricules.filter(m => m.car_id === carId);
    if (carMatricules.length === 0) {
      return { status: 'non_disponible', reason: 'Aucune immatriculation associée', availableCount: 0, totalCount: 0 };
    }
    const activeMatricules = carMatricules.filter(m => m.status === 'active');
    const availableMatricules = activeMatricules.filter(m => m.status === 'active');
    const hasAvailable = availableMatricules.length > 0;
    return {
      status: hasAvailable ? 'disponible' : 'non_disponible',
      reason: hasAvailable ? `${availableMatricules.length} matricule(s) disponible(s)` : 'Aucun matricule disponible',
      availableCount: availableMatricules.length,
      totalCount: carMatricules.length,
      activeCount: activeMatricules.length
    };
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon" />;
    return sortDirection === "asc" ? <ArrowUp size={12} className="sort-icon active" /> : <ArrowDown size={12} className="sort-icon active" />;
  };

  const filteredCars = cars.filter(car => 
    searchTerm === '' || 
    car.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.color?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    let aVal, bVal;
    switch (sortField) {
      case "id": aVal = a.id; bVal = b.id; break;
      case "brand": aVal = a.brand?.toLowerCase() || ""; bVal = b.brand?.toLowerCase() || ""; break;
      case "model": aVal = a.model?.toLowerCase() || ""; bVal = b.model?.toLowerCase() || ""; break;
      case "year": aVal = a.year || 0; bVal = b.year || 0; break;
      case "price": aVal = a.price_per_day || 0; bVal = b.price_per_day || 0; break;
      case "fuel_type": aVal = a.fuel_type || ""; bVal = b.fuel_type || ""; break;
      case "status": aVal = a.status || ""; bVal = b.status || ""; break;
      default: aVal = a.id; bVal = b.id;
    }
    if (sortDirection === "asc") return aVal > bVal ? 1 : -1;
    else return aVal < bVal ? 1 : -1;
  });

  const itemsPerView = viewMode === 'list' ? listItemsPerPage : cardsItemsPerPage;
  const totalPages = Math.ceil(filteredCars.length / itemsPerView);
  const paginatedCars = filteredCars.slice((currentPage - 1) * itemsPerView, currentPage * itemsPerView);

  const featuredCount = cars.filter(car => car.is_featured).length;
  const MAX_FEATURED = 20;

  const handleCreateCar = async (data) => {
    setSubmitting(true);
    try {
      await dispatch(createCar(data)).unwrap();
      toast.success("Voiture ajoutée avec succès!");
      setShowCarForm(false);
      setEditingCar(null);
      setImagePreview('');
      await dispatch(fetchCars(true));
      await dispatch(fetchMatricules(true));
      resetForm();
    } catch (error) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCar = async (data) => {
    setSubmitting(true);
    try {
      await dispatch(updateCar({ id: editingCar.id, data })).unwrap();
      toast.success("Voiture modifiée avec succès!");
      setShowCarForm(false);
      setEditingCar(null);
      setImagePreview('');
      await dispatch(fetchCars(true));
      await dispatch(fetchMatricules(true));
      resetForm();
    } catch (error) {
      toast.error(error.message || "Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (car) => {
    setEditingCar(car);
    setFormData({
      brand: car.brand,
      model: car.model,
      year: car.year,
      color: car.color,
      fuel_type: car.fuel_type || "petrol",
      transmission: car.transmission || "manual",
      seats: car.seats || 5,
      doors: car.doors || 4,
      price_per_day: car.price_per_day,
      image: car.image || "",
      status: car.status || "disponible",
      is_featured: car.is_featured || false,
    });
    setImagePreview(car.image_url || car.image || '');
    setShowCarForm(true);
  };

  const handleAddNew = () => {
    setEditingCar(null);
    resetForm();
    setImagePreview('');
    setShowCarForm(true);
  };

  const resetForm = () => {
    setFormData({
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      fuel_type: "petrol",
      transmission: "manual",
      seats: 5,
      doors: 4,
      price_per_day: 100,
      image: "",
      status: "disponible",
      is_featured: false,
    });
  };

  const handleDeleteClick = (car) => {
    setCarToDelete(car);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!carToDelete) return;
    const result = await dispatch(deleteCar(carToDelete.id));
    if (result.error) toast.error(result.payload);
    else { 
      toast.success("Voiture supprimée avec succès"); 
      await dispatch(fetchCars(true));
      await dispatch(fetchMatricules(true));
    }
    setDeleteModalOpen(false);
    setCarToDelete(null);
  };

  const refreshData = async () => { 
    await dispatch(fetchCars(true)); 
    await dispatch(fetchMatricules(true));
    toast.success("Liste actualisée"); 
  };

  const handleExport = () => {
    const headers = ['ID', 'Marque', 'Modèle', 'Année', 'Couleur', 'Carburant', 'Transmission', 'Places', 'Portes', 'Prix/Jour', 'Statut', 'Disponibilité Réelle', 'Espace client'];
    const csvData = filteredCars.map(car => {
      const realStatus = getCarRealStatus(car.id);
      return [car.id, `"${car.brand}"`, `"${car.model}"`, car.year, `"${car.color}"`, car.fuel_type, car.transmission, car.seats, car.doors, car.price_per_day, car.status, realStatus.status, car.is_featured ? 'Publié' : 'Hors ligne'].join(',');
    });
    const blob = new Blob([headers.join(',') + '\n' + csvData.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `voitures_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success("Export CSV effectué");
  };

  const toggleFeatured = async (car) => {
    const newFeatured = !car.is_featured;
    
    if (newFeatured && featuredCount >= MAX_FEATURED) {
      toast.error(`Limite de ${MAX_FEATURED} voitures en avant atteinte.`);
      return;
    }

    try {
      await dispatch(updateCar({ 
        id: car.id, 
        data: { is_featured: newFeatured } 
      })).unwrap();
      
      toast.success(newFeatured ? "Ajouté aux avant-premières" : "Retiré des avant-premières");
      await dispatch(fetchCars(true));
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'disponible') return <span className="badge badge-available"><CheckCircle size={10} /> Disp.</span>;
    return <span className="badge badge-rented"><XCircle size={10} /> Non disp.</span>;
  };

  const getRealStatusBadge = (car) => {
    const realStatus = getCarRealStatus(car.id);
    if (realStatus.status === 'disponible') {
      return (
        <div className="real-status available compact">
          <CheckCircle2 size={10} />
          <span>{realStatus.availableCount}/{realStatus.totalCount}</span>
        </div>
      );
    }
    return (
      <div className="real-status unavailable compact">
        <AlertCircle size={10} />
        <span>{realStatus.totalCount}</span>
      </div>
    );
  };

  const getFuelBadge = (fuel) => {
    const config = { petrol: 'badge-amber', diesel: 'badge-blue', electric: 'badge-emerald', hybrid: 'badge-purple' };
    const labels = { petrol: 'Ess', diesel: 'Die', electric: 'Élec', hybrid: 'Hyb' };
    const icons = { petrol: <Fuel size={10} />, diesel: <Fuel size={10} />, electric: <Gauge size={10} />, hybrid: <Settings size={10} /> };
    return <span className={`badge ${config[fuel] || config.petrol} compact`}>{icons[fuel]} {labels[fuel] || fuel}</span>;
  };

  const getTransmissionLabel = (transmission) => {
    return transmission === 'automatic' ? 'Auto' : 'Man';
  };

  const getStats = () => {
    const total = cars.length;
    const disponible = cars.filter(car => getCarRealStatus(car.id).status === 'disponible').length;
    const nonDisponible = total - disponible;
    const totalPrice = cars.reduce((sum, car) => sum + (Number(car.price_per_day) || 0), 0);
    const avgPrice = total > 0 ? Math.round(totalPrice / total) : 0;
    const totalMatricules = matricules.length;
    const activeMatricules = matricules.filter(m => m.status === 'active').length;
    return { total, disponible, nonDisponible, avgPrice, totalMatricules, activeMatricules, featuredCount };
  };
  const stats = getStats();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner une image valide");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result;
        setFormData({ ...formData, image: imageUrl });
        setImagePreview(imageUrl);
      };
      reader.onerror = () => {
        toast.error("Erreur lors de la lecture de l'image");
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Chargement des véhicules...</p>
    </div>
  );

  return (
    <>
      {/* --- FORM (unchanged, compact redesign already applied) --- */}
      {showCarForm ? (
        <div className="inline-form-container">
          <div className="inline-form-header">
            <div className="inline-form-icon">
              {editingCar ? <Sparkles size={24} /> : <PlusCircle size={24} />}
            </div>
            <div className="inline-form-title">
              <h2>{editingCar ? "Modifier le véhicule" : "Nouveau véhicule"}</h2>
              <p>{editingCar ? "Modifiez les informations du véhicule" : "Ajoutez un nouveau véhicule à votre flotte"}</p>
            </div>
            <button onClick={() => { setShowCarForm(false); setEditingCar(null); resetForm(); setImagePreview(''); }} className="inline-form-close">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingCar) {
              handleUpdateCar(formData);
            } else {
              handleCreateCar(formData);
            }
          }} className="inline-form">
            <div className="inline-form-grid">
              <div className="inline-form-col">
                <div className="inline-section">
                  <div className="inline-section-header">
                    <Car size={18} className="section-icon" />
                    <h3>Informations du véhicule</h3>
                  </div>
                  <div className="inline-grid-2">
                    <div className="inline-field">
                      <label>Marque *</label>
                      <input 
                        type="text" 
                        className="inline-input" 
                        value={formData.brand} 
                        onChange={(e) => setFormData({...formData, brand: e.target.value})} 
                        required 
                        placeholder="Ex: Renault, Peugeot..."
                      />
                    </div>
                    <div className="inline-field">
                      <label>Modèle *</label>
                      <input 
                        type="text" 
                        className="inline-input" 
                        value={formData.model} 
                        onChange={(e) => setFormData({...formData, model: e.target.value})} 
                        required 
                        placeholder="Ex: Clio, 208..."
                      />
                    </div>
                    <div className="inline-field">
                      <label>Année *</label>
                      <input 
                        type="number" 
                        className="inline-input" 
                        value={formData.year} 
                        onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} 
                        required 
                      />
                    </div>
                    <div className="inline-field">
                      <label>Couleur *</label>
                      <input 
                        type="text" 
                        className="inline-input" 
                        value={formData.color} 
                        onChange={(e) => setFormData({...formData, color: e.target.value})} 
                        required 
                        placeholder="Ex: Rouge, Bleu..."
                      />
                    </div>
                  </div>
                </div>

                <div className="inline-section">
                  <div className="inline-section-header">
                    <Settings size={18} className="section-icon" />
                    <h3>Caractéristiques techniques</h3>
                  </div>
                  <div className="inline-grid-2">
                    <div className="inline-field">
                      <label>Carburant</label>
                      <select 
                        className="inline-select" 
                        value={formData.fuel_type} 
                        onChange={(e) => setFormData({...formData, fuel_type: e.target.value})}
                      >
                        <option value="petrol">⛽ Essence</option>
                        <option value="diesel">⛽ Diesel</option>
                        <option value="electric">🔋 Électrique</option>
                        <option value="hybrid">⚡ Hybride</option>
                      </select>
                    </div>
                    <div className="inline-field">
                      <label>Transmission</label>
                      <select 
                        className="inline-select" 
                        value={formData.transmission} 
                        onChange={(e) => setFormData({...formData, transmission: e.target.value})}
                      >
                        <option value="manual">⚙️ Manuelle</option>
                        <option value="automatic">⚙️ Automatique</option>
                      </select>
                    </div>
                    <div className="inline-field">
                      <label>Places</label>
                      <input 
                        type="number" 
                        className="inline-input" 
                        value={formData.seats} 
                        onChange={(e) => setFormData({...formData, seats: parseInt(e.target.value)})} 
                      />
                    </div>
                    <div className="inline-field">
                      <label>Portes</label>
                      <input 
                        type="number" 
                        className="inline-input" 
                        value={formData.doors} 
                        onChange={(e) => setFormData({...formData, doors: parseInt(e.target.value)})} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="inline-form-col">
                <div className="inline-section">
                  <div className="inline-section-header">
                    <DollarSign size={18} className="section-icon" />
                    <h3>Tarification et statut</h3>
                  </div>
                  <div className="inline-grid-2">
                    <div className="inline-field">
                      <label>Prix par jour (DH) *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="inline-input" 
                        value={formData.price_per_day} 
                        onChange={(e) => setFormData({...formData, price_per_day: parseFloat(e.target.value)})} 
                        required 
                      />
                    </div>
                    <div className="inline-field">
                      <label>Statut</label>
                      <select 
                        className="inline-select" 
                        value={formData.status} 
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="disponible">✅ Disponible</option>
                        <option value="non disponible">❌ Non disponible</option>
                      </select>
                    </div>
                  </div>
                  <div className="inline-info-message">
                    <Info size={16} />
                    <span>La disponibilité réelle dépend des immatriculations actives et des réservations en cours</span>
                  </div>
                </div>

                <div className="inline-section">
                  <div className="inline-section-header">
                    <Star size={18} className="section-icon" />
                    <h3>Mise en avant</h3>
                  </div>
                  <div className="inline-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ margin: 0 }}>Afficher en avant-première</label>
                    <input 
                      type="checkbox" 
                      checked={formData.is_featured} 
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      (Max {MAX_FEATURED} voitures)
                    </span>
                  </div>
                </div>

                <div className="inline-section">
                  <div className="inline-section-header">
                    <ImageIcon size={18} className="section-icon" />
                    <h3>Image du véhicule</h3>
                  </div>
                  <div className="image-upload-area" onClick={() => document.getElementById('carImageInput').click()}>
                    <Upload size={28} />
                    <p>Cliquez pour télécharger une image</p>
                    <p style={{ fontSize: '0.7rem', color: '#64748b' }}>PNG, JPG jusqu'à 5MB</p>
                    <input type="file" id="carImageInput" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  </div>
                  {imagePreview && (
                    <div className="image-preview-container">
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={() => { setImagePreview(''); setFormData({...formData, image: ''}); }}
                      >
                        <X size={14} /> Supprimer
                      </button>
                    </div>
                  )}
                </div>

                {editingCar && (
                  <div className="inline-section">
                    <div className="inline-section-header">
                      <Activity size={18} className="section-icon" />
                      <h3>Informations système</h3>
                    </div>
                    <div className="inline-info-grid">
                      <div className="inline-info-item">
                        <span className="info-label">Date de création</span>
                        <span className="info-value">
                          {editingCar.created_at ? new Date(editingCar.created_at).toLocaleDateString("fr-FR") : "—"}
                        </span>
                      </div>
                      <div className="inline-info-item">
                        <span className="info-label">Dernière modification</span>
                        <span className="info-value">
                          {editingCar.updated_at ? new Date(editingCar.updated_at).toLocaleDateString("fr-FR") : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="inline-form-footer">
              <button type="button" className="inline-secondary-btn" onClick={() => { setShowCarForm(false); setEditingCar(null); resetForm(); setImagePreview(''); }}>
                Annuler
              </button>
              <button type="submit" className="inline-primary-btn" disabled={submitting}>
                {submitting ? "Traitement..." : (editingCar ? "Mettre à jour" : "Créer le véhicule")}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Main Cars List with compact table
        <div className="admin-smaiti-page">
          <style>{`
            /* RESET & BASE */
            .admin-smaiti-page {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              background-color: #f7f9fc;
              color: #1a202c;
              min-height: 100vh;
              padding: 20px 40px;
            }

            /* TOPBAR */
            .smaiti-topbar {
              display: flex; justify-content: space-between; align-items: center;
              padding: 10px 0 20px 0; border-bottom: 1px solid #e2e8f0;
            }
            .smaiti-logo-area { display: flex; align-items: baseline; gap: 16px; }
            .smaiti-brand { font-family: 'Georgia', serif; color: #b6926e; font-size: 1.5rem; font-weight: 600; letter-spacing: 1px; }
            .smaiti-flotte { font-size: 1.8rem; font-weight: 700; color: #0f172a; }
            .smaiti-right-actions { display: flex; align-items: center; gap: 16px; }
            
            .smaiti-search-bar {
              display: flex; align-items: center; background: white;
              border-radius: 40px; padding: 8px 16px; border: 1px solid #e2e8f0;
              gap: 10px; transition: all 0.2s;
            }
            .smaiti-search-bar:focus-within { border-color: #0d4734; box-shadow: 0 0 0 3px rgba(13, 71, 52, 0.1); }
            .smaiti-search-bar input {
              border: none; outline: none; background: transparent;
              font-size: 0.875rem; width: 180px; color: #1a202c;
            }
            .smaiti-search-bar svg { color: #94a3b8; width: 16px; height: 16px; }
            .smaiti-notif-btn {
              background: white; border: 1px solid #e2e8f0; border-radius: 50%;
              width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
              cursor: pointer; transition: 0.2s; color: #1e293b;
            }
            .smaiti-notif-btn:hover { background: #f1f5f9; }

            /* STATS GRID */
            .stats-grid {
              display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
              gap: 1rem; margin: 1.5rem 0;
            }
            .stat-card {
              background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
              padding: 1rem; display: flex; justify-content: space-between; align-items: center;
              transition: all 0.2s;
            }
            .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .stat-number { font-size: 1.5rem; font-weight: 700; }
            .stat-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .stat-icon { opacity: 0.6; }

            /* ACTION BAR */
            .smaiti-actions-wrapper {
              display: flex; justify-content: space-between; align-items: center;
              padding: 10px 0 16px 0;
            }
            .smaiti-count { font-size: 0.875rem; color: #475569; }
            .smaiti-actions-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
            
            .btn { display: inline-flex; align-items: center; gap: 0.5rem; height: 2.5rem; padding: 0 1rem; border-radius: 9999px; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: all 0.2s; }
            .btn-secondary { background: white; border: 1px solid #e2e8f0; color: #0f172a; }
            .btn-secondary:hover { background: #f8fafc; }
            .btn-primary { background: #0d4734; color: white; }
            .btn-primary:hover { background: #0a3a2a; transform: translateY(-1px); }

            .view-toggle {
              display: flex; gap: 0; background: white; border: 1px solid #e2e8f0; border-radius: 9999px; overflow: hidden;
            }
            .view-btn {
              display: flex; align-items: center; gap: 0.5rem; padding: 0 0.875rem; height: 2.5rem;
              border: none; background: transparent; cursor: pointer; font-size: 0.75rem; font-weight: 500; color: #64748b; transition: 0.2s;
            }
            .view-btn.active { background: #0d4734; color: white; }
            .view-btn:hover:not(.active) { background: #f1f5f9; }

            /* COMPACT TABLE */
            .smaiti-table-container {
              background: white; border-radius: 12px;
              border: 1px solid #e2e8f0; 
              overflow-x: auto; 
              overflow-y: visible;
              -webkit-overflow-scrolling: touch;
            }
            .smaiti-table {
              width: 100%; border-collapse: collapse; font-size: 0.75rem;
              min-width: 900px; /* Reduced from 1100px */
            }
            .smaiti-table thead { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
            .smaiti-table th {
              text-align: left; padding: 10px 10px;
              color: #64748b; font-weight: 500; font-size: 0.65rem; text-transform: uppercase;
              white-space: nowrap;
            }
            .smaiti-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: 0.2s; }
            .smaiti-table tbody tr:last-child { border-bottom: none; }
            .smaiti-table tbody tr:hover { background: #f8fafc; }
            .smaiti-table td { padding: 8px 10px; vertical-align: middle; white-space: nowrap; }

            .sortable-header { cursor: pointer; user-select: none; }
            .sort-icon { opacity: 0.5; vertical-align: middle; margin-left: 4px; }
            .sort-icon.active { opacity: 1; color: #0d4734; }

            /* IMAGE & BADGES compact */
            .car-image-cell { width: 50px; }
            .car-thumbnail { width: 40px; height: 40px; object-fit: cover; border-radius: 0.5rem; border: 1px solid #e2e8f0; }
            .car-thumbnail-placeholder { width: 40px; height: 40px; background: #f1f5f9; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #94a3b8; }

            .badge {
              display: inline-flex; align-items: center; gap: 4px;
              padding: 2px 8px; border-radius: 40px; font-weight: 500; font-size: 0.65rem;
              white-space: nowrap;
            }
            .badge.compact { padding: 2px 6px; font-size: 0.6rem; }
            .badge-available { background: #e6f7ec; color: #0f973d; }
            .badge-rented { background: #fff3e6; color: #b45309; }
            .badge-published { background: #e7f3ef; color: #0d4734; }
            .badge-amber { background: #fef3c7; color: #92400e; }
            .badge-blue { background: #dbeafe; color: #1e40af; }
            .badge-emerald { background: #d1fae5; color: #065f46; }
            .badge-purple { background: #f3e8ff; color: #6b21a5; }

            .real-status.compact { display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; border-radius: 0.5rem; font-size: 0.6rem; font-weight: 500; }
            .real-status.available { background: #dcfce7; color: #166534; }
            .real-status.unavailable { background: #fee2e2; color: #991b1b; }

            /* ACTION BUTTONS compact */
            .action-icons { display: flex; gap: 4px; justify-content: flex-end; flex-wrap: wrap; }
            .action-btn {
              width: 28px; height: 28px; border-radius: 50%;
              border: none; display: flex; align-items: center; justify-content: center;
              cursor: pointer; transition: 0.2s; background: transparent;
            }
            .action-btn.edit { background: #f1f5f9; color: #64748b; }
            .action-btn.delete { background: #fee2e2; color: #ef4444; }
            .action-btn.featured-add { background: #fefce8; color: #ca8a04; }
            .action-btn.featured-remove { background: #fef3c7; color: #d97706; }
            .action-btn:hover { transform: scale(1.05); }
            .action-btn svg { width: 14px; height: 14px; }

            /* CARDS VIEW (unchanged) */
            .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1rem; }
            .car-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; transition: all 0.3s ease; }
            .car-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -12px rgba(0,0,0,0.1); }
            .card-image { position: relative; height: 170px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .card-image img { width: 100%; height: 100%; object-fit: cover; }
            .card-status { position: absolute; top: 0.75rem; right: 0.75rem; }
            .card-content { padding: 1rem; }
            .card-title { font-size: 1.125rem; font-weight: 700; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
            .card-price { font-size: 1.25rem; font-weight: 700; color: #0d4734; }
            .card-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 0.75rem 0; padding: 0.5rem 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
            .detail-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #64748b; }
            .card-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
            .card-action-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; background: white; cursor: pointer; transition: all 0.2s; }
            .card-action-btn:hover { background: #f1f5f9; }
            .card-action-btn.edit:hover { border-color: #0d4734; color: #0d4734; }
            .card-action-btn.delete:hover { border-color: #ef4444; color: #ef4444; }

            /* DELETE MODAL */
            .delete-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1001; }
            .delete-modal-card { background: white; border-radius: 20px; padding: 32px; max-width: 400px; width: 100%; text-align: center; }
            .delete-icon-box { width: 48px; height: 48px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: #dc2626; }
            .delete-modal-card h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; }
            .delete-modal-card p { color: #64748b; font-size: 0.875rem; margin-bottom: 24px; }
            .delete-actions { display: flex; gap: 12px; }
            .modal-btn-cancel { flex: 1; background: #f1f5f9; border: none; padding: 10px; border-radius: 40px; cursor: pointer; font-weight: 500; }
            .modal-btn-delete { flex: 1; background: #dc2626; color: white; border: none; padding: 10px; border-radius: 40px; cursor: pointer; font-weight: 500; }

            .loading { text-align: center; padding: 3rem; }
            .spinner { display: inline-block; width: 2rem; height: 2rem; border-radius: 50%; border: 2px solid #e2e8f0; border-top-color: #0f172a; animation: spin 0.6s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }

            .flex { display: flex; } .items-center { align-items: center; } .gap-1 { gap: 0.25rem; } .text-right { text-align: right; } .font-medium { font-weight: 500; }

            /* RESPONSIVE */
            @media (max-width: 1024px) {
                .smaiti-table th, .smaiti-table td { padding: 8px 6px; font-size: 0.65rem; }
            }
            @media (max-width: 768px) {
              .admin-smaiti-page { padding: 16px; }
              .smaiti-topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
              .smaiti-right-actions { width: 100%; justify-content: space-between; }
              .smaiti-actions-wrapper { flex-direction: column; align-items: flex-start; gap: 12px; }
              .smaiti-actions-buttons { width: 100%; justify-content: flex-end; flex-wrap: wrap; }
              .smaiti-table-container { overflow-x: auto; }
              .smaiti-table { min-width: 800px; }
              .stats-grid { grid-template-columns: repeat(2, 1fr); }
              .cards-grid { grid-template-columns: 1fr; }
              .view-toggle { width: 100%; justify-content: center; }
            }
          `}</style>

          <div>
            <div className="smaiti-topbar">
              <div className="smaiti-logo-area">
                <span className="smaiti-brand">SMAITI LUXE</span>
                <span className="smaiti-flotte">Flotte</span>
              </div>
              <div className="smaiti-right-actions">
                <div className="smaiti-search-bar">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
                <button className="smaiti-notif-btn"><Bell size={16} /></button>
                <button onClick={refreshData} className="smaiti-notif-btn" title="Actualiser"><RefreshCw size={16} /></button>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card"><div><p className="stat-label">Total Voitures</p><p className="stat-number">{stats.total}</p></div><CarFront size={28} className="stat-icon" /></div>
              <div className="stat-card"><div><p className="stat-label">Disponibles (Réel)</p><p className="stat-number text-green" style={{color: '#16a34a'}}>{stats.disponible}</p></div><CheckCircle2 size={28} className="stat-icon" style={{color: '#16a34a'}} /></div>
              <div className="stat-card"><div><p className="stat-label">Prix moyen/jour</p><p className="stat-number" style={{color: '#0d4734'}}>{stats.avgPrice.toLocaleString()} DH</p></div><DollarSign size={28} className="stat-icon" style={{color: '#0d4734'}} /></div>
              <div className="stat-card"><div><p className="stat-label">⭐ En avant</p><p className="stat-number" style={{color: '#ca8a04'}}>{stats.featuredCount} / {MAX_FEATURED}</p></div><Star size={28} className="stat-icon" style={{color: '#ca8a04'}} fill="currentColor" /></div>
            </div>

            <div className="smaiti-actions-wrapper">
              <span className="smaiti-count">{filteredCars.length} enregistrement(s)</span>
              <div className="smaiti-actions-buttons">
                <div className="view-toggle">
                  <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => { setViewMode('list'); setCurrentPage(1); }}><List size={16} /> Liste</button>
                  <button className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => { setViewMode('cards'); setCurrentPage(1); }}><LayoutGrid size={16} /> Cartes</button>
                </div>
                <button onClick={handleExport} className="btn btn-secondary"><Save size={14} /> Exporter</button>
                <button onClick={handleAddNew} className="btn btn-primary"><Plus size={14} /> Ajouter un véhicule</button>
              </div>
            </div>

            {/* COMPACT TABLE VIEW */}
            {viewMode === 'list' && (
              <div className="smaiti-table-container">
                <table className="smaiti-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort("id")} className="sortable-header">ID {getSortIcon("id")}</th>
                      <th>Image</th>
                      <th onClick={() => handleSort("brand")} className="sortable-header">Véhicule {getSortIcon("brand")}</th>
                      <th onClick={() => handleSort("year")} className="sortable-header">Année/Couleur {getSortIcon("year")}</th>
                      <th onClick={() => handleSort("fuel_type")} className="sortable-header">Carburant/Trans. {getSortIcon("fuel_type")}</th>
                      <th onClick={() => handleSort("price")} className="sortable-header">Prix {getSortIcon("price")}</th>
                      <th onClick={() => handleSort("status")} className="sortable-header">Statut {getSortIcon("status")}</th>
                      <th>Dispo. réelle</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCars.map((car) => {
                      const realStatus = getCarRealStatus(car.id);
                      return (
                        <tr key={car.id}>
                          <td className="font-medium">#{car.id}</td>
                          <td className="car-image-cell">
                            {(car.image_url || car.image) ? (
                              <img src={getImageUrl(car.image_url || car.image)} alt={`${car.brand} ${car.model}`} className="car-thumbnail" onError={(e) => e.target.style.display = 'none'} />
                            ) : (
                              <div className="car-thumbnail-placeholder"><Car size={20} /></div>
                            )}
                          </td>
                          <td className="font-medium">{car.brand} {car.model}</td>
                          <td>
                            <div className="flex items-center gap-1">
                              <Calendar size={12} /> {car.year}
                              <span style={{ margin: '0 4px' }}>·</span>
                              <Palette size={12} /> {car.color}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              {getFuelBadge(car.fuel_type)}
                              <span style={{ margin: '0 2px' }}>/</span>
                              <span className="text-xs">{getTransmissionLabel(car.transmission)}</span>
                            </div>
                          </td>
                          <td className="price-cell" style={{ fontWeight: 600, color: '#0d4734' }}>{car.price_per_day} DH</td>
                          <td>{getStatusBadge(car.status)}</td>
                          <td>{getRealStatusBadge(car)}</td>
                          <td>
                            <div className="action-icons">
                              <button 
                                onClick={() => toggleFeatured(car)} 
                                className={`action-btn ${car.is_featured ? 'featured-remove' : 'featured-add'}`} 
                                title={car.is_featured ? "Retirer des avant" : "Mettre en avant"}
                              >
                                <Star size={14} fill={car.is_featured ? "currentColor" : "none"} />
                              </button>
                              <button className="action-btn edit" onClick={() => handleEdit(car)} title="Modifier">
                                <Edit2 size={14} />
                              </button>
                              <button className="action-btn delete" onClick={() => handleDeleteClick(car)} title="Supprimer">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={listItemsPerPage}
                    onItemsPerPageChange={setListItemsPerPage}
                    totalItems={filteredCars.length}
                  />
                )}
              </div>
            )}

            {/* CARDS VIEW (unchanged) */}
            {viewMode === 'cards' && (
              <>
                <div className="cards-grid">
                  {paginatedCars.map((car) => {
                    const realStatus = getCarRealStatus(car.id);
                    return (
                      <div key={car.id} className="car-card" style={{ borderColor: car.is_featured ? '#eab308' : '#e2e8f0' }}>
                        <div className="card-image">
                          {(car.image_url || car.image) ? (
                            <img src={getImageUrl(car.image_url || car.image)} alt={`${car.brand} ${car.model}`} onError={(e) => e.target.src = ''} />
                          ) : (
                            <Car size={64} style={{ color: '#94a3b8' }} />
                          )}
                          <div className="card-status">{getStatusBadge(car.status)}</div>
                        </div>
                        <div className="card-content">
                          <div className="card-title">
                            <span>{car.brand} {car.model}</span>
                            <span className="card-price">{car.price_per_day} DH<span style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>/jour</span></span>
                          </div>
                          <div style={{ marginBottom: '0.5rem' }}>
                            {car.is_featured ? (
                              <span className="badge badge-published">
                                <Globe size={12} /> Publié
                              </span>
                            ) : (
                              <span className="badge" style={{ background: '#f1f5f9', color: '#94a3b8' }}>
                                <XCircle size={12} /> Hors ligne
                              </span>
                            )}
                          </div>
                          <div className="card-details">
                            <div className="detail-item"><Calendar size={14} /> {car.year}</div>
                            <div className="detail-item"><Palette size={14} /> {car.color}</div>
                            <div className="detail-item">{getFuelBadge(car.fuel_type)}</div>
                            <div className="detail-item"><Settings size={14} /> {getTransmissionLabel(car.transmission)}</div>
                            <div className="detail-item"><Users size={14} /> {car.seats} places</div>
                            <div className="detail-item"><DoorOpen size={14} /> {car.doors} portes</div>
                            <div className="detail-item"><Shield size={14} /> {realStatus.availableCount}/{realStatus.totalCount} disp.</div>
                          </div>
                          <div className="card-actions">
                            <button onClick={() => toggleFeatured(car)} className={`card-action-btn ${car.is_featured ? 'featured-btn' : ''}`} style={{ borderColor: car.is_featured ? '#eab308' : '#e2e8f0' }}>
                              <Star size={14} fill={car.is_featured ? "currentColor" : "none"} /> {car.is_featured ? "Retirer" : "En avant"}
                            </button>
                            <button onClick={() => handleEdit(car)} className="card-action-btn edit"><Edit2 size={14} /> Modifier</button>
                            <button onClick={() => handleDeleteClick(car)} className="card-action-btn delete"><Trash2 size={14} /> Supprimer</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={cardsItemsPerPage}
                    onItemsPerPageChange={setCardsItemsPerPage}
                    totalItems={filteredCars.length}
                  />
                )}
              </>
            )}
          </div>

          {/* DELETE MODAL */}
          {deleteModalOpen && carToDelete && (
            <div className="delete-modal-overlay">
              <div className="delete-modal-card">
                <div className="delete-icon-box"><TrashIcon size={24} /></div>
                <h3>Confirmer la suppression</h3>
                <p>Êtes-vous sûr de vouloir supprimer <br/> <strong>{carToDelete.brand} {carToDelete.model}</strong> ?</p>
                <div className="delete-actions">
                  <button className="modal-btn-cancel" onClick={() => setDeleteModalOpen(false)}>Annuler</button>
                  <button className="modal-btn-delete" onClick={confirmDelete}>Supprimer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- STYLES FOR THE FORM (unchanged) --- */}
      <style>{`
        /* Inline Form – redesigned to match dashboard */
        .inline-form-container {
          background: white;
          border-radius: 24px;
          margin: 1.5rem;
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .inline-form-header {
          background: #f8fafc;
          padding: 24px 32px;
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          border-bottom: 2px solid #0d4734;
        }

        .inline-form-icon {
          width: 48px;
          height: 48px;
          background: #0d4734;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .inline-form-title h2 {
          color: #0f172a;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .inline-form-title p {
          color: #64748b;
          font-size: 0.875rem;
          margin: 4px 0 0 0;
        }

        .inline-form-close {
          position: absolute;
          top: 20px;
          right: 24px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 40px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s;
        }

        .inline-form-close:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .inline-form {
          padding: 28px 32px;
        }

        .inline-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .inline-form-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .inline-section {
          background: white;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }

        .inline-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .inline-section-header .section-icon {
          color: #0d4734;
        }

        .inline-section-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }

        .inline-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .inline-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .inline-field label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .inline-input, .inline-select {
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.875rem;
          transition: all 0.2s;
          background: white;
          font-family: inherit;
          color: #0f172a;
        }

        .inline-input:focus, .inline-select:focus {
          outline: none;
          border-color: #0d4734;
          box-shadow: 0 0 0 3px rgba(13, 71, 52, 0.1);
        }

        .inline-info-message {
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.75rem;
          color: #166534;
          margin-top: 16px;
        }

        .inline-info-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .inline-info-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .inline-info-item .info-label {
          font-size: 0.75rem;
          color: #64748b;
        }

        .inline-info-item .info-value {
          font-size: 0.875rem;
          font-weight: 500;
          color: #0f172a;
        }

        .image-upload-area {
          border: 2px dashed #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafbfc;
        }

        .image-upload-area:hover {
          border-color: #0d4734;
          background: #f0fdf4;
        }

        .image-upload-area svg {
          color: #64748b;
        }

        .image-preview-container {
          margin-top: 16px;
          text-align: center;
        }

        .image-preview {
          width: 150px;
          height: 150px;
          object-fit: cover;
          border-radius: 16px;
          border: 2px solid #e2e8f0;
        }

        .remove-image-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          padding: 4px 12px;
          background: #fee2e2;
          border: none;
          border-radius: 20px;
          font-size: 0.7rem;
          color: #dc2626;
          cursor: pointer;
        }

        .inline-secondary-btn {
          background: white;
          border: 1.5px solid #e2e8f0;
          padding: 10px 24px;
          border-radius: 40px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
        }

        .inline-secondary-btn:hover {
          border-color: #0d4734;
          color: #0d4734;
          background: #f8fafc;
        }

        .inline-primary-btn {
          background: #0d4734;
          border: none;
          padding: 12px 28px;
          border-radius: 40px;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .inline-primary-btn:hover {
          background: #0a3a2a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13, 71, 52, 0.3);
        }

        .inline-primary-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .inline-form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          margin-top: 24px;
        }

        @media (max-width: 1024px) {
          .inline-form-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .inline-grid-2 {
            grid-template-columns: 1fr;
          }
          .inline-form-container {
            margin: 1rem;
          }
          .inline-form-header {
            padding: 16px 20px;
          }
          .inline-form-header h2 {
            font-size: 1.25rem;
          }
          .inline-form {
            padding: 20px;
          }
        }

        html, body {
          overflow-x: auto !important;
          min-width: 320px;
        }
        .admin-container, .inline-form-container {
          overflow-x: auto !important;
          min-width: 0;
          width: 100%;
        }
        .inline-form {
          overflow-x: auto !important;
        }
        .inline-form-grid {
          min-width: 600px;
        }
        @media (max-width: 768px) {
          .inline-form-grid {
            min-width: 100%;
          }
        }
      `}</style>
    </>
  );
}