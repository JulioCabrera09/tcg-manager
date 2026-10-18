'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Store,
  Barcode,
  Layers,
  AlertTriangle,
  Plus,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Settings,
  Database,
  Search,
  Sparkles,
  X,
  Lock,
  ArrowRight,
  ShoppingBag,
  Users,
  MessageSquare,
  Trash2,
  Mail,
  UserCheck,
  Send,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { Tenant, GlobalProduct, UserProfile, AdminSupportMessage } from '@/types/database';
import { hashPassword, verifyPassword } from '@/lib/security';

export default function SuperAdminPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(dataStore.getCurrentUser());
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [globals, setGlobals] = useState<GlobalProduct[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [supportMessages, setSupportMessages] = useState<AdminSupportMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'tenants' | 'global_catalog' | 'users' | 'support'>('tenants');

  // Admin Login Gate State
  const [adminLoginEmail, setAdminLoginEmail] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  // New Tenant Modal
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: '',
    slug: '',
    tagline: '',
    phone: '',
    address: '',
    theme_color: '#2563EB',
    storage_limit_items: 500,
  });

  // New Global Barcode Modal
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [newGlobal, setNewGlobal] = useState({
    barcode: '',
    name: '',
    category: 'tcg_sealed' as GlobalProduct['category'],
    tcg_game: 'Pokemon' as GlobalProduct['tcg_game'],
    suggested_price: 110,
    description: '',
  });

  // User Management Filter & User Creation Modal
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'store_admin' | 'store_staff' | 'regular_user'>('admin');
  const [newUserTenantId, setNewUserTenantId] = useState<string>('tenant-omega-01');

  // Support Reply State
  const [selectedStoreForSupport, setSelectedStoreForSupport] = useState<string>('tenant-omega-01');
  const [supportReplyText, setSupportReplyText] = useState('');

  useEffect(() => {
    loadData();
    const handleUserChanged = () => {
      setCurrentUser(dataStore.getCurrentUser());
      loadData();
    };
    const handleSupportChanged = () => {
      setSupportMessages(dataStore.getAdminSupportMessages());
    };
    window.addEventListener('tcg_user_changed', handleUserChanged);
    window.addEventListener('tcg_support_changed', handleSupportChanged);
    return () => {
      window.removeEventListener('tcg_user_changed', handleUserChanged);
      window.removeEventListener('tcg_support_changed', handleSupportChanged);
    };
  }, []);

  const loadData = () => {
    setCurrentUser(dataStore.getCurrentUser());
    setTenants(dataStore.getTenants());
    setGlobals(dataStore.getGlobalProducts());
    setUsers(dataStore.getUsers());
    setSupportMessages(dataStore.getAdminSupportMessages());
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    const allUsers = dataStore.getUsers();
    const found = allUsers.find((u) => u.email.toLowerCase() === adminLoginEmail.toLowerCase());

    if (!found || (found.role !== 'superadmin' && found.role !== 'admin')) {
      setAdminLoginError('Credenciales inválidas o cuenta sin privilegios administrativos.');
      return;
    }

    if (found.password_hash) {
      const valid = await verifyPassword(adminLoginPassword, found.password_hash);
      if (!valid) {
        setAdminLoginError('Contraseña incorrecta.');
        return;
      }
    }

    dataStore.setCurrentUserId(found.id);
    setCurrentUser(found);
  };

  const handleQuickAdminLogin = (userId: string) => {
    dataStore.setCurrentUserId(userId);
    loadData();
  };

  const handleToggleTenantStatus = (tenant: Tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const confirmMsg =
      newStatus === 'suspended'
        ? `¿Deseas suspender a "${tenant.name}" por falta de pago? Su storefront y ERP quedarán bloqueados.`
        : `¿Reactivar suscripción para "${tenant.name}"?`;

    if (confirm(confirmMsg)) {
      dataStore.updateTenant({ id: tenant.id, status: newStatus });
      loadData();
    }
  };

  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.slug) return;

    dataStore.addTenant({
      name: newTenant.name,
      slug: newTenant.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      tagline: newTenant.tagline,
      phone: newTenant.phone,
      address: newTenant.address,
      theme_color: newTenant.theme_color,
      storage_limit_items: Number(newTenant.storage_limit_items) || 500,
      status: 'active',
      is_hiring: false,
    });

    setIsTenantModalOpen(false);
    setNewTenant({
      name: '',
      slug: '',
      tagline: '',
      phone: '',
      address: '',
      theme_color: '#2563EB',
      storage_limit_items: 500,
    });
    loadData();
  };

  const handleSaveGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGlobal.barcode || !newGlobal.name) return;

    dataStore.addGlobalProduct({
      barcode: newGlobal.barcode.trim(),
      name: newGlobal.name,
      category: newGlobal.category,
      tcg_game: newGlobal.tcg_game,
      suggested_price: Number(newGlobal.suggested_price) || 0,
      description: newGlobal.description,
    });

    setIsGlobalModalOpen(false);
    setNewGlobal({
      barcode: '',
      name: '',
      category: 'tcg_sealed',
      tcg_game: 'Pokemon',
      suggested_price: 110,
      description: '',
    });
    loadData();
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === 'usr-superadmin') {
      alert('La cuenta principal de Super Admin (Julio Cabrera) está protegida contra eliminación.');
      return;
    }
    if (currentUser?.role === 'admin') {
      const target = users.find((u) => u.id === userId);
      if (target?.role === 'superadmin') {
        alert('Un Administrador no tiene permisos para eliminar al Super Admin Maestro.');
        return;
      }
    }
    if (confirm(`¿Estás seguro de eliminar al usuario "${userName}"? Esta acción removerá sus accesos al sistema.`)) {
      try {
        dataStore.deleteUser(userId);
        loadData();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Error al eliminar usuario');
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) return;

    const hash = await hashPassword(newUserPassword);
    const selectedTenant = tenants.find((t) => t.id === newUserTenantId) || tenants[0];

    const baseProfile: Omit<UserProfile, 'id'> = {
      name: newUserName.trim(),
      alias: `${newUserName.trim().replace(/\s+/g, '')}_${
        newUserRole === 'admin'
          ? 'Admin'
          : newUserRole === 'store_admin'
          ? 'Owner'
          : newUserRole === 'store_staff'
          ? 'Staff'
          : 'User'
      }`,
      email: newUserEmail.trim(),
      password_hash: hash,
      role: newUserRole,
      city: 'CDMX',
      strikes: 0,
      is_banned: false,
      reputation_positive: 100,
      reputation_negative: 0,
      rating: 5.0,
      total_trades: 0,
      is_verified_store: newUserRole === 'store_admin',
    };

    if (newUserRole === 'store_admin' || newUserRole === 'store_staff') {
      baseProfile.tenant_id = selectedTenant?.id;
      baseProfile.store_name = selectedTenant?.name;
      baseProfile.store_slug = selectedTenant?.slug;
    }

    if (newUserRole === 'store_staff') {
      baseProfile.staff_permissions = {
        can_manage_inventory: true,
        can_use_pos: true,
        can_manage_tournaments: true,
        can_view_finances: false,
        can_edit_landing: false,
      };
    }

    dataStore.addUserProfile(baseProfile);

    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('admin');
    setNewUserTenantId(tenants[0]?.id || 'tenant-omega-01');
    loadData();
  };

  const handleSendSupportReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportReplyText.trim()) return;

    const targetTenant = tenants.find((t) => t.id === selectedStoreForSupport);
    dataStore.sendAdminSupportMessage({
      store_id: selectedStoreForSupport,
      store_name: targetTenant?.name || 'Tienda',
      sender_id: currentUser?.id || 'usr-superadmin',
      sender_name: `${currentUser?.name} (${currentUser?.role === 'superadmin' ? 'Super Admin' : 'Admin'})`,
      sender_role: currentUser?.role as 'superadmin' | 'admin',
      content: supportReplyText.trim(),
    });

    // Also notify the store
    dataStore.addNotification({
      recipient_id: selectedStoreForSupport,
      recipient_type: 'store',
      title: 'Respuesta de Soporte de Plataforma',
      message: supportReplyText.trim(),
      type: 'new_message',
      link_url: '/dashboard?tab=settings',
    });

    setSupportReplyText('');
    setSupportMessages(dataStore.getAdminSupportMessages());
  };

  const totalActiveTenants = tenants.filter((t) => t.status === 'active').length;
  const totalSuspendedTenants = tenants.filter((t) => t.status === 'suspended').length;

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.alias && u.alias.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
      (u.store_name && u.store_name.toLowerCase().includes(userSearchQuery.toLowerCase()));

    const matchesRole =
      userRoleFilter === 'ALL' || u.role === userRoleFilter;

    return matchesSearch && matchesRole;
  });

  // RESTRICTED ACCESS SCREEN WITH LOGIN GATE FOR NON-ADMIN USERS
  if (currentUser?.role !== 'superadmin' && currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 transition-colors duration-200">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 uppercase tracking-wider">
              Acceso Restringido
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Panel Maestro / Super Admin
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ingresa con tus credenciales autorizadas de Super Admin o Administrador de Infraestructura.
            </p>
          </div>

          {adminLoginError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{adminLoginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico Administrativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={adminLoginEmail}
                  onChange={(e) => setAdminLoginEmail(e.target.value)}
                  placeholder="admin@tcgecosystem.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={adminLoginPassword}
                  onChange={(e) => setAdminLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Iniciar Sesión en Super Admin
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/marketplace" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              ← Volver al Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Super Admin Header - Solid Colors */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {currentUser?.role === 'superadmin' ? 'Panel Maestro (Super Admin)' : 'Panel de Control (Sub-Admin)'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                  {currentUser?.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestión de tiendas suscritas, usuarios de plataforma, soporte y catálogo maestro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Ver ERP de Tienda
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Tiendas Activas
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalActiveTenants}</span>
              <Store className="w-5 h-5 text-emerald-500/40" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Servicio ininterrumpido</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Tiendas Suspendidas
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{totalSuspendedTenants}</span>
              <AlertTriangle className="w-5 h-5 text-rose-500/40" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Bloqueadas por falta de pago</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Usuarios Registrados
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{users.length}</span>
              <Users className="w-5 h-5 text-blue-500/40" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Compradores y tiendas afiliadas</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Códigos Globales
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{globals.length}</span>
              <Barcode className="w-5 h-5 text-purple-500/40" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Compartidos en toda la plataforma</p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 py-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'tenants'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            Tiendas Clientes ({tenants.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'users'
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Gestión de Usuarios ({users.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'support'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Mensajes de Tiendas (Soporte)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('global_catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'global_catalog'
                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Barcode className="w-4 h-4" />
            Catálogo Global Maestro
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: TENANTS */}
        {/* ========================================================================= */}
        {activeTab === 'tenants' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Tiendas Suscritas (Tenants)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control de altas, bajas, cuotas de productos y subdominios
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTenantModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Registrar Nueva Tienda
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Tienda</th>
                      <th className="px-4 py-3">Subdominio</th>
                      <th className="px-4 py-3">Cuota Almacén</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {tenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: t.theme_color || '#2563EB' }}
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                              <div className="text-[10px] text-slate-400">{t.phone || 'Sin teléfono'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                          {t.slug}.tcgecosystem.com
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {t.storage_limit_items} productos
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {t.status === 'active' ? 'Activa' : 'Suspendida'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/tienda/${t.slug}`}
                              target="_blank"
                              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                              title="Visitar Storefront"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleToggleTenantStatus(t)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                t.status === 'active'
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300'
                              }`}
                            >
                              {t.status === 'active' ? 'Suspender' : 'Reactivar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: USERS MANAGEMENT (AUDIO 3) */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Directorio Global de Usuarios
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visualiza qué cuentas pertenecen a Marketplace, tiendas o administradores
                </p>
              </div>

              {currentUser?.role === 'superadmin' && (
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  Crear Cuenta
                </button>
              )}
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, correo, alias o tienda..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {[
                  { id: 'ALL', label: 'Todos' },
                  { id: 'regular_user', label: 'Marketplace' },
                  { id: 'store_admin', label: 'Dueños Tienda' },
                  { id: 'store_staff', label: 'Staff Tienda' },
                  { id: 'admin', label: 'Sub-Admins' },
                  { id: 'superadmin', label: 'Super Admin' },
                ].map((rf) => (
                  <button
                    key={rf.id}
                    type="button"
                    onClick={() => setUserRoleFilter(rf.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      userRoleFilter === rf.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Usuario / Alias</th>
                      <th className="px-4 py-3">Correo Electrónico</th>
                      <th className="px-4 py-3">Tipo de Cuenta</th>
                      <th className="px-4 py-3">Tienda Vinculada</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredUsers.map((u) => {
                      const isSuper = u.role === 'superadmin';
                      return (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                {u.name}
                                {isSuper && (
                                  <span title="Super Admin Protegido">
                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                                @{u.alias || u.name.replace(/\s+/g, '_')}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                            {u.email}
                          </td>
                          <td className="px-4 py-3">
                            {u.role === 'superadmin' ? (
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                Super Admin Maestro
                              </span>
                            ) : u.role === 'admin' ? (
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                                Sub-Admin Plataforma
                              </span>
                            ) : u.role === 'store_admin' ? (
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                Dueño de Tienda
                              </span>
                            ) : u.role === 'store_staff' ? (
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                                Staff de Tienda
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                Usuario Marketplace
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {u.store_name ? (
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {u.store_name} ({u.store_slug})
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Ninguna</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isSuper ? (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                Blindada
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title="Eliminar Cuenta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SUPPORT MESSAGES WITH STORE OWNERS (AUDIO 2 & 3) */}
        {/* ========================================================================= */}
        {activeTab === 'support' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Mesa de Ayuda y Mensajes Directos con Tiendas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Responde solicitudes de ampliación de cuotas, soporte técnico y consultas de los dueños de tiendas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stores Selector List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 py-1">
                  Tiendas Afiliadas
                </span>
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedStoreForSupport(t.id)}
                    className={`w-full p-3 rounded-xl text-left transition flex items-center justify-between cursor-pointer ${
                      selectedStoreForSupport === t.id
                        ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{t.name}</div>
                      <div className="text-[10px] text-slate-400">{t.slug}.tcgecosystem.com</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>

              {/* Chat Thread */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between h-[450px] overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Conversación con {tenants.find((t) => t.id === selectedStoreForSupport)?.name}
                    </span>
                    <span className="text-[10px] text-slate-400">Canal Seguro Super Admin</span>
                  </div>
                </div>

                {/* Messages List */}
                <div className="p-4 overflow-y-auto space-y-3 flex-1">
                  {supportMessages
                    .filter((m) => m.store_id === selectedStoreForSupport)
                    .map((msg) => {
                      const isSuper = msg.sender_role === 'superadmin' || msg.sender_role === 'admin';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isSuper ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`p-3 rounded-2xl max-w-md text-xs ${
                              isSuper
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none'
                            }`}
                          >
                            <span className="block text-[10px] font-bold opacity-75 mb-0.5">
                              {msg.sender_name}
                            </span>
                            <p className="leading-relaxed">{msg.content}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                </div>

                {/* Reply Input */}
                <form onSubmit={handleSendSupportReply} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-950">
                  <input
                    type="text"
                    required
                    value={supportReplyText}
                    onChange={(e) => setSupportReplyText(e.target.value)}
                    placeholder="Escribe tu respuesta a la tienda..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: GLOBAL CATALOG */}
        {/* ========================================================================= */}
        {activeTab === 'global_catalog' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Catálogo Maestro Universal</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Códigos de barras precargados compartidos por todas las tiendas del SaaS
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGlobalModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Registrar Código Global
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Código de Barras</th>
                      <th className="px-4 py-3">Nombre del Producto</th>
                      <th className="px-4 py-3">Juego TCG</th>
                      <th className="px-4 py-3">Categoría</th>
                      <th className="px-4 py-3">Precio Sugerido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {globals.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {g.barcode}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{g.name}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{g.tcg_game || 'Universal'}</td>
                        <td className="px-4 py-3 uppercase text-[10px] font-mono text-slate-500">{g.category}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          ${g.suggested_price || 0} MXN
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: USER ACCOUNT CREATION */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-600" />
                Crear Cuenta de Usuario
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registra una nueva cuenta y asígnale su rol en el ecosistema (Sub-Admin, Tienda, Staff o Comprador).
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej. Roberto Morales"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="usuario@dominio.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña Inicial *
                </label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Cuenta *
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) =>
                    setNewUserRole(
                      e.target.value as 'admin' | 'store_admin' | 'store_staff' | 'regular_user'
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white cursor-pointer font-medium"
                >
                  <option value="admin">🛡️ Sub-Admin de plataforma</option>
                  <option value="store_admin">🏪 Dueño de tienda (Store Owner)</option>
                  <option value="store_staff">💼 Staff de tienda (Cajero / Operador)</option>
                  <option value="regular_user">👤 Usuario de marketplace / Comprador común</option>
                </select>
              </div>

              {/* Si es dueño o staff de tienda, seleccionar qué tienda le pertenece */}
              {(newUserRole === 'store_admin' || newUserRole === 'store_staff') && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                    Tienda Asignada *
                  </label>
                  <select
                    value={newUserTenantId}
                    onChange={(e) => setNewUserTenantId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs cursor-pointer"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.slug}.tcgecosystem.com)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW TENANT */}
      {isTenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Registrar Nueva Tienda SaaS</h3>
              <button
                type="button"
                onClick={() => setIsTenantModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTenant} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">Nombre Comercial de la Tienda *</label>
                <input
                  type="text"
                  required
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  placeholder="Ej. Magic Palace Monterrey"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">Slug / Subdominio Web *</label>
                <input
                  type="text"
                  required
                  value={newTenant.slug}
                  onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
                  placeholder="magic-palace"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  URL: {newTenant.slug || 'nombre'}.tcgecosystem.com
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                    placeholder="5512345678"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1">Límite de Catálogo</label>
                  <input
                    type="number"
                    value={newTenant.storage_limit_items}
                    onChange={(e) => setNewTenant({ ...newTenant, storage_limit_items: parseInt(e.target.value) || 500 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTenantModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Crear Tienda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW GLOBAL BARCODE */}
      {isGlobalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Nuevo Código Global Maestro</h3>
              <button
                type="button"
                onClick={() => setIsGlobalModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveGlobal} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">Código de Barras (EAN-13 / UPC) *</label>
                <input
                  type="text"
                  required
                  value={newGlobal.barcode}
                  onChange={(e) => setNewGlobal({ ...newGlobal, barcode: e.target.value })}
                  placeholder="0820650853509"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">Nombre Oficial del Producto *</label>
                <input
                  type="text"
                  required
                  value={newGlobal.name}
                  onChange={(e) => setNewGlobal({ ...newGlobal, name: e.target.value })}
                  placeholder="Ej. Sobre Booster Pokémon Corona Astral"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1">Categoría</label>
                  <select
                    value={newGlobal.category}
                    onChange={(e) =>
                      setNewGlobal({
                        ...newGlobal,
                        category: e.target.value as GlobalProduct['category'],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="tcg_sealed">Sobre / Sellado</option>
                    <option value="accessory">Accesorio</option>
                    <option value="beverage">Bebida</option>
                    <option value="snack">Botana / Alimento</option>
                    <option value="tcg_single">Carta Individual</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1">Precio Sugerido ($)</label>
                  <input
                    type="number"
                    value={newGlobal.suggested_price}
                    onChange={(e) =>
                      setNewGlobal({ ...newGlobal, suggested_price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGlobalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Guardar en Catálogo Global
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
