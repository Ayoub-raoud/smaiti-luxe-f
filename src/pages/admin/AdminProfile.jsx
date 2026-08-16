// src/pages/admin/AdminProfile.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, updateProfile } from '../../Redux/store';
import { toast } from 'sonner';
import { 
    User, 
    Lock, 
    Key, 
    Save, 
    UserCircle, 
    Shield, 
    Calendar, 
    CheckCircle,
    AlertCircle,
    Eye,
    EyeOff,
    Bell,
    RefreshCw,
    Crown,
    Briefcase,
    Clock
} from 'lucide-react';

export default function AdminProfile() {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);

    const [fullname, setFullname] = useState(user?.Fullname || '');
    const [role, setRole] = useState(user?.role || '');
    const [createdAt, setCreatedAt] = useState(user?.created_at || '');

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password && password !== passwordConfirmation) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }
        if (password && password.length < 6) {
            toast.error('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        const data = { Fullname: fullname };
        if (password) {
            data.password = password;
            data.password_confirmation = passwordConfirmation;
        }
        setLoading(true);
        try {
            await dispatch(updateProfile(data)).unwrap();
            toast.success('Profil mis à jour avec succès');
            setPassword('');
            setPasswordConfirmation('');
        } catch (err) {
            toast.error(err || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'superadmin': return 'Super Admin';
            case 'admin': return 'Administrateur';
            case 'employee': return 'Employé';
            default: return role || 'Utilisateur';
        }
    };

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'superadmin': return 'badge-superadmin';
            case 'admin': return 'badge-admin';
            case 'employee': return 'badge-employee';
            default: return 'badge-default';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="admin-smaiti-page">
            <style>{`
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
                .smaiti-notif-btn {
                    background: white; border: 1px solid #e2e8f0; border-radius: 50%;
                    width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: 0.2s; color: #1e293b;
                }
                .smaiti-notif-btn:hover { background: #f1f5f9; }

                /* STATS / USER CARD */
                .user-card {
                    background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
                    padding: 1.5rem; margin: 1.5rem 0;
                    display: flex; justify-content: space-between; align-items: center;
                    flex-wrap: wrap; gap: 1rem;
                }
                .user-card-left { display: flex; align-items: center; gap: 1.5rem; }
                .user-avatar {
                    width: 64px; height: 64px; background: #0d4734; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center; color: white;
                }
                .user-avatar svg { width: 32px; height: 32px; }
                .user-info h2 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
                .user-info .user-role {
                    display: inline-flex; align-items: center; gap: 0.4rem;
                    padding: 0.2rem 0.8rem; border-radius: 40px; font-size: 0.7rem; font-weight: 600;
                }
                .badge-superadmin { background: #fef3c7; color: #92400e; }
                .badge-admin { background: #f3e8ff; color: #6b21a5; }
                .badge-employee { background: #dbeafe; color: #1e40af; }
                .badge-default { background: #f1f5f9; color: #475569; }

                .user-card-right .user-date {
                    display: flex; align-items: center; gap: 0.5rem;
                    font-size: 0.875rem; color: #64748b;
                }

                /* FORM (matching inline forms from AdminCars) */
                .inline-form-container {
                    background: white; border-radius: 24px;
                    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.1);
                    overflow: hidden; border: 1px solid #e2e8f0;
                }
                .inline-form-header {
                    background: #f8fafc; padding: 24px 32px;
                    display: flex; align-items: center; gap: 20px;
                    position: relative; border-bottom: 2px solid #0d4734;
                }
                .inline-form-icon {
                    width: 48px; height: 48px; background: #0d4734;
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    color: white; flex-shrink: 0;
                }
                .inline-form-title h2 { color: #0f172a; font-size: 1.5rem; font-weight: 700; margin: 0; }
                .inline-form-title p { color: #64748b; font-size: 0.875rem; margin: 4px 0 0 0; }

                .inline-form { padding: 28px 32px; }
                .inline-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
                .inline-form-col { display: flex; flex-direction: column; gap: 24px; }
                .inline-section {
                    background: white; border-radius: 16px; padding: 20px;
                    border: 1px solid #e2e8f0;
                }
                .inline-section-header {
                    display: flex; align-items: center; gap: 10px;
                    margin-bottom: 20px; padding-bottom: 12px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .inline-section-header .section-icon { color: #0d4734; }
                .inline-section-header h3 { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0; }
                .inline-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .inline-field {
                    display: flex; flex-direction: column; gap: 6px;
                }
                .inline-field label {
                    display: flex; align-items: center; gap: 0.4rem;
                    font-size: 0.7rem; font-weight: 600; color: #475569;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .inline-field label .label-icon { color: #94a3b8; }
                .inline-input {
                    padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 12px;
                    font-size: 0.875rem; transition: all 0.2s; background: white;
                    font-family: inherit; color: #0f172a; width: 100%;
                }
                .inline-input:focus {
                    outline: none; border-color: #0d4734; box-shadow: 0 0 0 3px rgba(13, 71, 52, 0.1);
                }
                .inline-input:disabled { background: #f8fafc; cursor: not-allowed; }

                .field-error {
                    display: flex; align-items: center; gap: 0.4rem;
                    font-size: 0.7rem; color: #dc2626; margin-top: 4px;
                }

                .password-input-wrapper {
                    position: relative;
                }
                .password-input-wrapper .inline-input {
                    padding-right: 2.8rem;
                }
                .password-toggle {
                    position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
                    background: none; border: none; color: #94a3b8;
                    cursor: pointer; padding: 0.25rem; display: flex;
                    align-items: center; justify-content: center; border-radius: 0.5rem;
                    transition: all 0.2s;
                }
                .password-toggle:hover { color: #475569; background: #f1f5f9; }

                .inline-info-message {
                    background: #f0fdf4; border: 1px solid #86efac;
                    border-radius: 12px; padding: 12px 16px;
                    display: flex; align-items: center; gap: 10px;
                    font-size: 0.75rem; color: #166534; margin-top: 16px;
                }

                .inline-form-footer {
                    display: flex; justify-content: flex-end; gap: 16px;
                    padding-top: 24px; border-top: 1px solid #e2e8f0; margin-top: 24px;
                }
                .inline-primary-btn {
                    background: #0d4734; border: none; padding: 12px 28px;
                    border-radius: 40px; font-size: 0.875rem; font-weight: 600;
                    color: white; cursor: pointer; transition: all 0.2s;
                    display: inline-flex; align-items: center; gap: 8px;
                }
                .inline-primary-btn:hover:not(:disabled) {
                    background: #0a3a2a; transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(13, 71, 52, 0.3);
                }
                .inline-primary-btn:disabled {
                    opacity: 0.6; cursor: not-allowed; transform: none;
                }
                .loading-spinner {
                    display: inline-block; width: 20px; height: 20px;
                    border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
                    border-radius: 50%; animation: spin 0.6s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Responsive */
                @media (max-width: 1024px) {
                    .inline-form-grid { grid-template-columns: 1fr; gap: 24px; }
                }
                @media (max-width: 768px) {
                    .admin-smaiti-page { padding: 16px; }
                    .smaiti-topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
                    .smaiti-right-actions { width: 100%; justify-content: flex-start; }
                    .user-card { flex-direction: column; align-items: flex-start; }
                    .user-card-left { flex-wrap: wrap; }
                    .inline-form-header { padding: 16px 20px; }
                    .inline-form-header h2 { font-size: 1.25rem; }
                    .inline-form { padding: 20px; }
                    .inline-grid-2 { grid-template-columns: 1fr; }
                    .inline-form-footer { justify-content: center; }
                }

                /* Dark mode */
                @media (prefers-color-scheme: dark) {
                    .admin-smaiti-page { background: #0f172a; color: #f1f5f9; }
                    .smaiti-flotte { color: #f1f5f9; }
                    .smaiti-notif-btn { background: #1e293b; border-color: #334155; color: #e2e8f0; }
                    .smaiti-notif-btn:hover { background: #334155; }
                    .user-card { background: #1e293b; border-color: #334155; }
                    .user-info h2 { color: #f1f5f9; }
                    .user-card-right .user-date { color: #94a3b8; }
                    .inline-form-container { background: #1e293b; border-color: #334155; }
                    .inline-form-header { background: #0f172a; border-bottom-color: #0d4734; }
                    .inline-form-header h2 { color: #f1f5f9; }
                    .inline-form-header p { color: #94a3b8; }
                    .inline-section { background: #1e293b; border-color: #334155; }
                    .inline-section-header h3 { color: #f1f5f9; }
                    .inline-section-header .section-icon { color: #0d4734; }
                    .inline-field label { color: #94a3b8; }
                    .inline-input { background: #0f172a; border-color: #334155; color: #f1f5f9; }
                    .inline-input:focus { border-color: #0d4734; box-shadow: 0 0 0 3px rgba(13, 71, 52, 0.3); }
                    .inline-input:disabled { background: #1e293b; }
                    .password-toggle { color: #64748b; }
                    .password-toggle:hover { background: #1e293b; color: #cbd5e1; }
                    .inline-info-message { background: #0f172a; border-color: #0d4734; color: #86efac; }
                    .inline-form-footer { border-top-color: #334155; }
                    .inline-primary-btn { background: #0d4734; color: white; }
                    .inline-primary-btn:hover:not(:disabled) { background: #0a3a2a; }
                    .field-error { color: #fca5a5; }
                    .badge-superadmin { background: #78350f; color: #fde68a; }
                    .badge-admin { background: #4c1d95; color: #c084fc; }
                    .badge-employee { background: #1e3a5f; color: #60a5fa; }
                    .badge-default { background: #334155; color: #cbd5e1; }
                }

                .flex { display: flex; } .items-center { align-items: center; } .gap-1 { gap: 0.25rem; }
            `}</style>

            {/* TOPBAR */}
            <div className="smaiti-topbar">
                <div className="smaiti-logo-area">
                    <span className="smaiti-brand">SMAITI LUXE</span>
                    <span className="smaiti-flotte">Profil</span>
                </div>
                <div className="smaiti-right-actions">
                    <button className="smaiti-notif-btn" title="Actualiser" onClick={() => window.location.reload()}>
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* USER CARD */}
            <div className="user-card">
                <div className="user-card-left">
                    <div className="user-avatar">
                        <UserCircle size={32} />
                    </div>
                    <div className="user-info">
                        <h2>{fullname || 'Utilisateur'}</h2>
                        <span className={`user-role ${getRoleBadgeStyle(role)}`}>
                            <Shield size={12} /> {getRoleLabel(role)}
                        </span>
                    </div>
                </div>
                <div className="user-card-right">
                    <div className="user-date">
                        <Clock size={14} />
                        <span>Membre depuis le {formatDate(createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* PROFILE FORM */}
            <div className="inline-form-container">
                <div className="inline-form-header">
                    <div className="inline-form-icon">
                        <User size={24} />
                    </div>
                    <div className="inline-form-title">
                        <h2>Modifier mes informations</h2>
                        <p>Gérez vos informations personnelles et votre mot de passe</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="inline-form">
                    <div className="inline-form-grid">
                        {/* Left Column */}
                        <div className="inline-form-col">
                            <div className="inline-section">
                                <div className="inline-section-header">
                                    <User size={18} className="section-icon" />
                                    <h3>Informations personnelles</h3>
                                </div>
                                <div className="inline-grid-2">
                                    <div className="inline-field">
                                        <label>
                                            <User size={14} className="label-icon" />
                                            Nom complet
                                        </label>
                                        <input
                                            type="text"
                                            value={fullname}
                                            onChange={(e) => setFullname(e.target.value)}
                                            className="inline-input"
                                            required
                                            placeholder="Votre nom complet"
                                        />
                                    </div>
                                    <div className="inline-field">
                                        <label>
                                            <Shield size={14} className="label-icon" />
                                            Rôle
                                        </label>
                                        <input
                                            type="text"
                                            value={getRoleLabel(role)}
                                            className="inline-input"
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="inline-form-col">
                            <div className="inline-section">
                                <div className="inline-section-header">
                                    <Lock size={18} className="section-icon" />
                                    <h3>Changer le mot de passe</h3>
                                </div>
                                <div className="inline-info-message">
                                    <AlertCircle size={16} />
                                    <span>Laissez les champs vides pour conserver votre mot de passe actuel.</span>
                                </div>
                                <div className="inline-grid-2" style={{ marginTop: '1rem' }}>
                                    <div className="inline-field">
                                        <label>
                                            <Key size={14} className="label-icon" />
                                            Nouveau mot de passe
                                        </label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="inline-input"
                                                placeholder="Nouveau mot de passe"
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="inline-field">
                                        <label>
                                            <CheckCircle size={14} className="label-icon" />
                                            Confirmer
                                        </label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordConfirmation}
                                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                                className="inline-input"
                                                placeholder="Confirmez le mot de passe"
                                                disabled={!password}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {password && passwordConfirmation && password !== passwordConfirmation && (
                                            <div className="field-error">
                                                <AlertCircle size={14} />
                                                <span>Les mots de passe ne correspondent pas</span>
                                            </div>
                                        )}
                                        {password && password.length > 0 && password.length < 6 && (
                                            <div className="field-error">
                                                <AlertCircle size={14} />
                                                <span>Le mot de passe doit contenir au moins 6 caractères</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="inline-form-footer">
                        <button type="submit" className="inline-primary-btn" disabled={loading}>
                            {loading ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Enregistrer les modifications
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}