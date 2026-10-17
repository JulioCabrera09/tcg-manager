'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Barcode, X, AlertCircle, CheckCircle2, Search, Sparkles } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { playBeep } from '@/lib/audio';
import { dataStore } from '@/lib/store';
import { TenantProduct, GlobalProduct } from '@/types/database';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onScanSuccess: (barcode: string, matchedProduct?: TenantProduct, matchedGlobal?: GlobalProduct) => void;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  tenantId,
  onScanSuccess,
}: BarcodeScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('manual');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lastScanned, setLastScanned] = useState<{
    code: string;
    product?: TenantProduct;
    global?: GlobalProduct;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setLastScanned(null);
      setManualCode('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const elementId = 'tcg-barcode-reader';
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(elementId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.777778,
        },
        (decodedText) => {
          handleCodeDetected(decodedText);
        },
        () => {
          // Frame scanner ignore
        }
      );
      setIsCameraActive(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo acceder a la cámara';
      setCameraError(`Permiso denegado o cámara no disponible (${message}). Puedes ingresar el código manualmente.`);
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {
        // Ignored
      }
      setIsCameraActive(false);
    }
  };

  const handleCodeDetected = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    playBeep('success');

    const matchedProduct = dataStore.getProductByBarcode(tenantId, cleanCode);
    const matchedGlobal = !matchedProduct
      ? dataStore.getGlobalProductByBarcode(cleanCode)
      : undefined;

    setLastScanned({
      code: cleanCode,
      product: matchedProduct,
      global: matchedGlobal,
    });

    onScanSuccess(cleanCode, matchedProduct, matchedGlobal);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Escáner de Códigos de Barras</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pistola USB, cámara o ingreso manual</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Barcode className="w-4 h-4" />
            Pistola USB / Teclado
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            Cámara en Vivo
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'camera' ? (
            <div className="space-y-3">
              <div
                id="tcg-barcode-reader"
                className="w-full min-h-[220px] bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 text-sm"
              >
                {!isCameraActive && !cameraError && (
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-slate-600 animate-pulse" />
                    <span>Iniciando sensor óptico...</span>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              <p className="text-center text-xs text-slate-500">
                Apunta la cámara al código de barras de la carta, sobre sellado o refresco.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Escanear con Pistola USB o Escribir Código:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ej. 0820650853412 o TCG-POK-CHARIZARD"
                    autoFocus
                    className="w-full pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-blue-600 font-mono"
                  />
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Buscar
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tip: Las pistolas lectoras USB escriben el código y presionan Enter automáticamente.
                </p>
              </form>

              {/* Quick test buttons */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-2">
                  Prueba rápida con códigos de demostración:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { code: '0820650853412', label: 'Sobre Pokémon' },
                    { code: 'TCG-POK-CHARIZARD', label: 'Charizard SIR' },
                    { code: '7501055312345', label: 'Coca-Cola' },
                    { code: '0744278453219', label: 'Micas Dragon Shield' },
                    { code: 'CAFE-BURGER-01', label: 'Hamburguesa Smash' },
                  ].map((test) => (
                    <button
                      key={test.code}
                      type="button"
                      onClick={() => handleCodeDetected(test.code)}
                      className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg font-mono transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      {test.label} ({test.code})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Last scanned feedback banner */}
          {lastScanned && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Código Leído con Éxito</span>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{lastScanned.code}</span>
              </div>

              {lastScanned.product ? (
                <div className="p-2.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                    Producto en Inventario de la Tienda
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{lastScanned.product.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">${lastScanned.product.price.toFixed(2)}</span>
                    <span>Stock: <strong className="text-slate-900 dark:text-white">{lastScanned.product.stock_quantity}</strong> uds</span>
                    {lastScanned.product.card_condition && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                        {lastScanned.product.card_condition}
                      </span>
                    )}
                  </div>
                </div>
              ) : lastScanned.global ? (
                <div className="p-2.5 bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-900/40 rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
                    Encontrado en Catálogo Global Maestro
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{lastScanned.global.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Precio sugerido: ${lastScanned.global.suggested_price?.toFixed(2) || 'N/A'}. Puedes darlo de alta en tu inventario con 1 clic.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Código no registrado en el inventario. Puedes crearlo como nuevo producto en tu tienda.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Cerrar Escáner
          </button>
        </div>
      </div>
    </div>
  );
}
