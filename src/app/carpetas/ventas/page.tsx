'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Package,
  Calendar,
  User,
  ShieldCheck,
  TrendingUp,
  FolderArchive,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { SalesRecord, UserProfile } from '@/types/database';

export default function ControlVentasPage() {
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = () => {
    setSales(dataStore.getSalesRecords());
    setCurrentUser(dataStore.getCurrentUser());
  };

  const totalRevenue = sales.reduce((sum, s) => sum + s.final_price, 0);
  const totalCardsSold = sales.reduce((sum, s) => sum + s.copies_sold, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/carpetas"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Carpetas y Vitrinas</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Control de Inventario Cerrado</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <Receipt className="w-3.5 h-3.5" />
            Historial de Ventas Concretadas
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Control de Ventas & Descuento de Inventario
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Registro automático de cada carta vendida mediante la confirmación mutua de transacción en el chat.
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Monto Total Acumulado
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Ingresos cerrados en tratos externos
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Copias Totales Descontadas
            </span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {totalCardsSold} cartas
            </div>
            <span className="text-[11px] text-slate-500">
              Removidas automáticamente de las vitrinas
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tratos Bilaterales Cerrados
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {sales.length}
            </div>
            <span className="text-[11px] text-slate-500">
              Confirmados con éxito por ambas partes
            </span>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Bitácora de Cartas Vendidas
            </h3>
            <span className="text-xs text-slate-400">{sales.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Carta / Código</th>
                  <th className="px-4 py-3">Rareza / Idioma</th>
                  <th className="px-4 py-3">Vendido A (Comprador)</th>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-4 py-3">Copias</th>
                  <th className="px-4 py-3">Monto Final</th>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {sale.card_name}
                      </div>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
                        {sale.card_code}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {sale.rarity}
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                        {sale.language}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sale.buyer_name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {sale.seller_name}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {sale.copies_sold} u.
                    </td>

                    <td className="px-4 py-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                      ${sale.final_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-400 text-[10px]">
                      {new Date(sale.completed_at).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Cerrado Bilateral
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sales.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No hay ventas registradas aún. Cuando concretes un acuerdo en el chat de ofertas y ambas partes pulsen &quot;Transacción Aceptada&quot;, aparecerá aquí.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
