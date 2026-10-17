'use client';

import React, { useState } from 'react';
import { useSupabaseStatus } from '@/lib/supabase/useRealtime';
import { Radio, Database, Cloud, ExternalLink, X, CheckCircle2, Copy, Check } from 'lucide-react';

export default function SupabaseConnectionBadge() {
  const { isConfigured } = useSupabaseStatus();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpenModal(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
          isConfigured
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
        }`}
        title="Estado de conexión en tiempo real con Supabase"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isConfigured ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isConfigured ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </span>
        <Radio className="w-3 h-3" />
        <span>{isConfigured ? 'Supabase Realtime Activo' : 'Realtime: Simulación Local'}</span>
      </button>

      {/* Modal Guía de Conexión Supabase & Vercel */}
      {isOpenModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsOpenModal(false)}
        >
          <div
            className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-xs text-slate-700 dark:text-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Conexión Supabase & Despliegue en Vercel
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl border flex items-start gap-2.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  {isConfigured ? '¡Conexión a la nube establecida!' : 'Modo actual: Simulación en Tiempo Real Activa'}
                </span>
                <p className="text-[11px] leading-relaxed">
                  {isConfigured
                    ? 'El sistema está conectado exitosamente a tu proyecto de Supabase en la nube con WebSockets Realtime activos.'
                    : 'La plataforma cuenta con un canal BroadcastChannel que permite probar pujas, chats e inventarios en vivo entre pestañas del navegador. Para conectar la base de datos oficial en la nube, sigue los pasos a continuación.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                Variables de Entorno para Vercel o .env.local:
              </h4>

              <div className="space-y-2">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-sans">URL del Proyecto</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">NEXT_PUBLIC_SUPABASE_URL</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('NEXT_PUBLIC_SUPABASE_URL', 'url')}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                  >
                    {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                </div>

                <div className="p-2.5 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-sans">Clave Anónima Pública</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'key')}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                  >
                    {copiedKey === 'key' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-1.5 text-[11px]">
                <span className="font-bold text-blue-900 dark:text-blue-200 block">
                  Script de Base de Datos listo:
                </span>
                <p className="text-slate-600 dark:text-slate-300">
                  El esquema SQL completo con todas las tablas (subastas, torneos, inventario, chats, fotos y RLS) se encuentra en <code className="px-1 py-0.5 bg-white dark:bg-slate-900 rounded font-mono font-bold text-blue-600">supabase/schema.sql</code>. Cópialo y pégalo directamente en el <strong>SQL Editor</strong> de tu panel de Supabase.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
