'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FolderArchive,
  User,
  ShieldCheck,
  Star,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  MessageCircle,
  Gavel,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Save,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { UserProfile, VirtualBinder, BinderCard } from '@/types/database';
import { sanitizeMexicanPhone, isValidMexicanPhone } from '@/lib/security';
import AddCardModal from '@/components/AddCardModal';
import Footer from '@/components/Footer';

export default function MiCarpetaDigitalPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(dataStore.getCurrentUser());
  const [userBinder, setUserBinder] = useState<VirtualBinder | null>(null);
  const [userCards, setUserCards] = useState<BinderCard[]>([]);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);

  // Edit Profile Form State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editAlias, setEditAlias] = useState(currentUser.alias || '');
  const [editPhone, setEditPhone] = useState(currentUser.phone || '');
  const [editCity, setEditCity] = useState(currentUser.city || 'CDMX');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadData = () => {
    const user = dataStore.getCurrentUser();
    setCurrentUser(user);
    setEditName(user.name);
    setEditAlias(user.alias || user.name.replace(/\s+/g, '_'));
    setEditPhone(user.phone || '');
    setEditCity(user.city || 'CDMX');

    // Load or auto-create binder for user
    const binders = dataStore.getBinders();
    let binder = binders.find((b) => b.user_id === user.id);
    if (!binder) {
      binder = dataStore.createBinder({
        user_id: user.id,
        owner_name: user.alias || user.name,
        is_store: false,
        name: `Carpeta Personal de ${user.alias || user.name}`,
        tcg_game: 'Yu-Gi-Oh!',
        description: 'Colección de cartas sueltas para venta e intercambio directo en el Marketplace TCG.',
        is_public: true,
      });
    }
    setUserBinder(binder);

    // Load cards of this binder
    const cards = dataStore.getBinderCards(binder.id);
    setUserCards(cards);
  };

  useEffect(() => {
    loadData();

    const handleUserChanged = () => {
      loadData();
    };
    window.addEventListener('tcg_user_changed', handleUserChanged);
    return () => window.removeEventListener('tcg_user_changed', handleUserChanged);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (editPhone && !isValidMexicanPhone(editPhone)) {
      setSaveError('El número de WhatsApp debe tener 10 dígitos numéricos (México).');
      return;
    }

    const updated = dataStore.updateUserProfile(currentUser.id, {
      name: editName.trim(),
      alias: editAlias.trim() || editName.trim().replace(/\s+/g, '_'),
      phone: editPhone ? sanitizeMexicanPhone(editPhone) : '',
      city: editCity.trim(),
    });

    setCurrentUser(updated);
    setSaveSuccess(true);
    setIsEditingProfile(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm('¿Deseas remover esta carta de tu carpeta digital?')) {
      dataStore.removeCardFromBinder(cardId);
      if (userBinder) {
        setUserCards(dataStore.getBinderCards(userBinder.id));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 flex-1">
        {/* Header Hero */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
              {currentUser.avatar_url ? (
                <Image
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                (currentUser.alias || currentUser.name).charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800 uppercase tracking-wider">
                  Coleccionista Verificado
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {currentUser.id}
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {currentUser.name}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  @{currentUser.alias || currentUser.name.replace(/\s+/g, '_')}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {currentUser.city || 'CDMX'}
                </span>
                {currentUser.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      {currentUser.phone}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {isEditingProfile ? 'Cerrar Edición' : 'Editar Mi Perfil'}
            </button>
            <button
              type="button"
              onClick={() => setIsAddCardModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Agregar Carta a Carpeta
            </button>
          </div>
        </div>

        {/* Edit Profile Form Collapsible */}
        {isEditingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 animate-fade-in"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Configurar Datos Públicos del Perfil
            </h3>

            {saveError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Alias Público (Visible en vitrinas) *
                </label>
                <input
                  type="text"
                  required
                  value={editAlias}
                  onChange={(e) => setEditAlias(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  placeholder="SantiTCG_CDMX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  WhatsApp Contacto (10 dígitos)
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="5512345678"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Ciudad / Estado
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="Monterrey, N.L."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </form>
        )}

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Perfil actualizado exitosamente. Tus datos ya están visibles en el Marketplace.</span>
          </div>
        )}

        {/* Virtual Binder Showcase & Cards Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {userBinder?.name || 'Mi Carpeta Virtual'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {userCards.length} carta(s) publicadas en la vitrina comunitaria del Marketplace
              </p>
            </div>

            <Link
              href="/marketplace?tab=singles"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Ver vitrina en Marketplace
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {userCards.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
              <FolderArchive className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tu carpeta digital está vacía
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Agrega las cartas coleccionables que deseas vender o intercambiar. Aparecerán de inmediato en el Marketplace TCG unificado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCardModalOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Agregar mi Primera Carta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {userCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div className="p-2 space-y-2">
                    <div className="relative aspect-[3/4.2] w-full bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
                      {card.image_url ? (
                        <Image
                          src={card.image_url}
                          alt={card.name_es || card.name_en}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <FolderArchive className="w-8 h-8 text-slate-400" />
                      )}
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/75 text-white backdrop-blur-xs font-mono">
                        {card.condition}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        {card.card_code} • {card.language}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {card.name_es || card.name_en}
                      </h4>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {card.rarity}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      ${(card.sale_price ?? 0).toFixed(2)} MXN
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Eliminar de mi vitrina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer variant="landing" />

      {/* Add Card Modal */}
      <AddCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => {
          setIsAddCardModalOpen(false);
          loadData();
        }}
        binders={userBinder ? [userBinder] : []}
        defaultBinderId={userBinder?.id}
        onCardAdded={() => loadData()}
      />
    </div>
  );
}
