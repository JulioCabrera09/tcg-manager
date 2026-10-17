'use client';

import React, { useState, useEffect } from 'react';
import { dataStore } from '@/lib/store';
import { UserProfile } from '@/types/database';
import { ShieldCheck, Store, User, ChevronDown, Check, Sparkles } from 'lucide-react';

export default function RoleSwitcher() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(dataStore.getCurrentUser());
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const handleUserChanged = () => {
      setCurrentUser(dataStore.getCurrentUser());
    };

    setUsers(dataStore.getUsers());
    window.addEventListener('tcg_user_changed', handleUserChanged);
    return () => window.removeEventListener('tcg_user_changed', handleUserChanged);
  }, []);

  const handleSelectUser = (user: UserProfile) => {
    dataStore.setCurrentUserId(user.id);
    setCurrentUser(user);
    setIsOpen(false);
  };

  const getRoleBadge = (user: UserProfile) => {
    if (user.role === 'superadmin') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          Super Admin
        </span>
      );
    }
    if (user.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
          <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          Sub-Admin
        </span>
      );
    }
    if (user.role === 'store_admin') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <Store className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Dueño Tienda
        </span>
      );
    }
    if (user.role === 'store_staff') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
          <Store className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
          Staff Tienda
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
        <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
        Usuario Común
      </span>
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
        title="Cambiar rol o cuenta de prueba"
      >
        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
          {currentUser.role === 'superadmin' ? (
            <ShieldCheck className="w-4 h-4" />
          ) : currentUser.role === 'store_admin' ? (
            <Store className="w-4 h-4" />
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>

        <div className="hidden xl:block text-xs leading-tight">
          <div className="font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
            {currentUser.name}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {currentUser.role === 'superadmin'
              ? 'Super Admin'
              : currentUser.role === 'store_admin'
              ? currentUser.store_name || 'Tienda'
              : 'Coleccionista'}
          </div>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
      </button>

      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in space-y-1.5"
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Simulador de Roles & Cuentas
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
              Cambia de cuenta con 1 clic para ver la Navbar y vistas como Super Admin, Dueño de Tienda o Usuario Común.
            </p>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {users.map((u) => {
              const isSelected = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectUser(u)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {u.name}
                      </span>
                    </div>
                    <div>{getRoleBadge(u)}</div>
                    {u.store_name && (
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Tienda: {u.store_name} ({u.store_slug})
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
