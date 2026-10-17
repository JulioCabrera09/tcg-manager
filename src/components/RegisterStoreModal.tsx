'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  MapPin,
  Phone,
  Globe,
  Tag,
  Palette,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { sanitizeMexicanPhone, isValidMexicanPhone } from '@/lib/security';
import { Tenant, TCGGame } from '@/types/database';

interface RegisterStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_THEMES = [
  { name: 'Azul Real', color: '#2563EB' },
  { name: 'Índigo Moderno', color: '#4F46E5' },
  { name: 'Violeta Místico', color: '#7C3AED' },
  { name: 'Esmeralda', color: '#059669' },
  { name: 'Ámbar Dorado', color: '#D97706' },
  { name: 'Rojo Carmesí', color: '#E11D48' },
];

const AVAILABLE_GAMES: TCGGame[] = [
  'Yu-Gi-Oh!',
  'Pokemon',
  'Magic',
  'One Piece',
  'Lorcana',
  'Otro',
];

export default function RegisterStoreModal({ isOpen, onClose }: RegisterStoreModalProps) {
  const router = useRouter();
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [themeColor, setThemeColor] = useState('#2563EB');
  const [selectedGames, setSelectedGames] = useState<TCGGame[]>(['Yu-Gi-Oh!', 'Pokemon']);
  const [error, setError] = useState<string | null>(null);
  const [createdTenant, setCreatedTenant] = useState<Tenant | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setStoreName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
  };

  const toggleGame = (game: TCGGame) => {
    if (selectedGames.includes(game)) {
      if (selectedGames.length > 1) {
        setSelectedGames(selectedGames.filter((g) => g !== game));
      }
    } else {
      setSelectedGames([...selectedGames, game]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!storeName.trim() || storeName.trim().length < 3) {
      setError('El nombre de la tienda debe tener al menos 3 caracteres.');
      return;
    }

    if (!slug.trim() || slug.length < 3) {
      setError('El subdominio/slug debe tener al menos 3 caracteres alfanuméricos.');
      return;
    }

    // Check slug uniqueness
    const existingTenants = dataStore.getTenants();
    if (existingTenants.some((t) => t.slug.toLowerCase() === slug.toLowerCase())) {
      setError(`El subdominio "${slug}" ya está registrado por otra tienda. Elige uno diferente.`);
      return;
    }

    if (!phone || !isValidMexicanPhone(phone)) {
      setError('Debes ingresar un número celular válido de 10 dígitos (México).');
      return;
    }

    // Create Tenant in store
    const newTenant: Omit<Tenant, 'id' | 'created_at'> = {
      name: storeName.trim(),
      slug: slug.toLowerCase().trim(),
      tagline: tagline.trim() || 'Especialistas en Cartas TCG, Accesorios y Torneos',
      description: `Tienda oficial de ${storeName.trim()} afiliada al ecosistema TCG. Catálogo en tiempo real, reservas contra entrega y torneos oficiales.`,
      theme_color: themeColor,
      address: city ? `${city}, México` : 'México',
      phone: sanitizeMexicanPhone(phone),
      whatsapp: sanitizeMexicanPhone(phone),
      status: 'active',
      storage_limit_items: 200,
      is_hiring: false,
      rating: 5.0,
      rating_count: 1,
    };

    const savedTenant = dataStore.addTenant(newTenant);

    // Update current user to store_admin
    const currentUser = dataStore.getCurrentUser();
    dataStore.updateUserProfile(currentUser.id, {
      role: 'store_admin',
      tenant_id: savedTenant.id,
      store_slug: savedTenant.slug,
      store_name: savedTenant.name,
      is_verified_store: true,
      phone: sanitizeMexicanPhone(phone),
    });

    dataStore.setActiveTenantId(savedTenant.id);
    setCreatedTenant(savedTenant);
  };

  const handleGoToERP = () => {
    onClose();
    router.push('/dashboard');
  };

  const handleGoToStorefront = () => {
    onClose();
    if (createdTenant) {
      router.push(`/tienda/${createdTenant.slug}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {createdTenant ? '¡Tienda Creada con Éxito!' : 'Registrar mi Tienda TCG'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {createdTenant
                  ? 'Tu storefront y subdominio están configurados y activos'
                  : 'Obtén tu subdominio, Punto de Venta POS y vitrina en el Marketplace'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {createdTenant ? (
            /* Success State */
            <div className="space-y-6 text-center py-2 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  ¡Felicidades, {createdTenant.name}!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Tu cuenta ha sido actualizada a <span className="font-bold text-blue-600 dark:text-blue-400">Administrador de Tienda</span>. Tu tienda cuenta con su propio subdominio dedicado y catálogo sincronizado.
                </p>
              </div>

              {/* Subdomain & URL Card */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-left space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Accesos a tu Tienda
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Subdominio Local:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {createdTenant.slug}.localhost:3000
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Ruta Directa:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      /tienda/{createdTenant.slug}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGoToERP}
                  className="w-full sm:w-1/2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  Gestionar Inventario en ERP
                </button>
                <button
                  type="button"
                  onClick={handleGoToStorefront}
                  className="w-full sm:w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver Storefront Público
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Store Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de la Tienda *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej: Arcadia TCG Store"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subdominio asignado *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) =>
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '')
                        )
                      }
                      placeholder="arcadia-tcg"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    URL: {slug ? `${slug}.tcgecosystem.com` : 'tu-tienda.tcgecosystem.com'}
                  </span>
                </div>
              </div>

              {/* Tagline / Eslogan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Eslogan o Giro Comercial
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ej: Tu santuario de cartas vintage, torneos y accesorios en CDMX"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* City and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ciudad / Estado *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Monterrey, N.L."
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp de Atención (10 dígitos) *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="5512345678"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    {phone.length}/10 dígitos requeridos
                  </span>
                </div>
              </div>

              {/* Theme Color Selection (Solid colors) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Color de Marca para tu Storefront
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {AVAILABLE_THEMES.map((theme) => (
                    <button
                      key={theme.color}
                      type="button"
                      onClick={() => setThemeColor(theme.color)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                        themeColor === theme.color
                          ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/60 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: theme.color }}
                      />
                      <span>{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* TCG Games Handled */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Juegos TCG que maneja tu tienda
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_GAMES.map((game) => {
                    const isSelected = selectedGames.includes(game);
                    return (
                      <button
                        key={game}
                        type="button"
                        onClick={() => toggleGame(game)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {game}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  Crear Tienda & Habilitar ERP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
