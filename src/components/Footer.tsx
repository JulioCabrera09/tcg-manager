'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, Lock, X, Layers, ExternalLink } from 'lucide-react';

interface FooterProps {
  variant?: 'marketplace' | 'dashboard' | 'storefront' | 'landing';
  storeName?: string;
}

export default function Footer({ variant = 'marketplace', storeName }: FooterProps) {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <>
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-[10px]">
              T
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {storeName ? `${storeName} • Powered by TCG Ecosystem` : 'TCG Ecosystem Platform'}
            </span>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span>© {new Date().getFullYear()} Todos los derechos reservados</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => {
                setLegalTab('terms');
                setLegalModalOpen(true);
              }}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1 cursor-pointer font-medium"
            >
              <FileText className="w-3.5 h-3.5" />
              Términos y Condiciones
            </button>

            <button
              type="button"
              onClick={() => {
                setLegalTab('privacy');
                setLegalModalOpen(true);
              }}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1 cursor-pointer font-medium"
            >
              <Lock className="w-3.5 h-3.5" />
              Acuerdo de Privacidad
            </button>
          </div>
        </div>
      </footer>

      {/* Legal Modal (Términos & Privacidad) */}
      {legalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Marco Legal y Cumplimiento Normativo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLegalModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 pt-2">
              <button
                type="button"
                onClick={() => setLegalTab('terms')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  legalTab === 'terms'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Términos y Condiciones
              </button>
              <button
                type="button"
                onClick={() => setLegalTab('privacy')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  legalTab === 'privacy'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Acuerdo de Privacidad
              </button>
            </div>

            {/* Content area */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              {legalTab === 'terms' ? (
                <>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                      1. Naturaleza de la Plataforma e Intermediación
                    </h4>
                    <p>
                      TCG Ecosystem actúa como una plataforma tecnológica neutral que provee software de gestión ERP para tiendas especializadas y un punto de encuentro de vitrinas, carpetas virtuales y subastas entre usuarios (C2C) y comercios afiliados (B2C).
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                      2. Modalidades de Compra y Entrega
                    </h4>
                    <p>
                      Los usuarios disponen de dos modalidades para formalizar pedidos: (a) <strong>Retiro y pago en sucursal (Click & Collect)</strong>, donde la transacción monetaria y entrega física se efectúa en las instalaciones de la tienda; o (b) <strong>Envío a domicilio</strong>, convenido de mutuo acuerdo mediante el chat interno seguro entre comprador y vendedor para pactar método de pago, paquetería y número de guía.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                      3. Subastas y Sistema Anti-Troll
                    </h4>
                    <p>
                      Toda puja registrada en una subasta activa constituye un compromiso de adquisición. En caso de incumplimiento de pago injustificado dentro del plazo de 24 horas, la plataforma aplicará una sanción (strike), reasignará el derecho de compra al segundo postor más alto y suspenderá preventivamente la cuenta infractora.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                      4. Propiedad Intelectual
                    </h4>
                    <p>
                      Todos los nombres, códigos de cartas, logos e imágenes de Pokémon, Yu-Gi-Oh!, Magic: The Gathering, One Piece y Lorcana pertenecen a sus respectivos creadores y titulares de derechos de autor.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                      1. Responsable del Tratamiento de Datos
                    </h4>
                    <p>
                      La plataforma protege y resguarda los datos de registro (nombre de usuario, número telefónico y correo electrónico) para la prestación exclusiva de los servicios de reserva, subastas y comunicación interna.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                      2. Privacidad en Envíos y Chats
                    </h4>
                    <p>
                      La información domiciliaria o bancaria facilitada para envíos se transmite de forma cifrada en los canales de negociación directa entre cliente y tienda, sin ser divulgada a terceros no autorizados.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                      3. Ejercicio de Derechos de Acceso y Rectificación
                    </h4>
                    <p>
                      Los usuarios pueden en cualquier momento modificar sus datos de contacto o solicitar la baja de su carpeta virtual o cuenta comercial desde la configuración de su perfil.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModalOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Entendido y Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
