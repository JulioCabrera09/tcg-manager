'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Printer,
  X,
  CreditCard,
  Banknote,
  Send,
  Calendar,
  Receipt,
  TrendingUp,
  Package,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Order, Tenant } from '@/types/database';

interface CorteCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  tenant: Tenant | null;
  onSelectTicket: (order: Order) => void;
}

export default function CorteCajaModal({
  isOpen,
  onClose,
  orders,
  tenant,
  onSelectTicket,
}: CorteCajaModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  if (!isOpen) return null;

  // Filter completed POS orders for the selected date
  const filteredOrders = orders.filter((o) => {
    if (o.status !== 'completed' && o.status !== 'ready_for_pickup') return false;
    const orderDate = new Date(o.created_at).toISOString().split('T')[0];
    return orderDate === selectedDate;
  });

  const totalSales = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalSubtotal = filteredOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const totalDiscounts = filteredOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);

  const cashOrders = filteredOrders.filter((o) => o.payment_method === 'cash' || o.payment_method === 'cash_on_pickup');
  const cardOrders = filteredOrders.filter((o) => o.payment_method === 'card');
  const transferOrders = filteredOrders.filter((o) => o.payment_method === 'transfer');

  const totalCash = cashOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCard = cardOrders.reduce((sum, o) => sum + o.total, 0);
  const totalTransfer = transferOrders.reduce((sum, o) => sum + o.total, 0);

  // Calculate top sold products
  const productCountMap: { [name: string]: { qty: number; total: number } } = {};
  filteredOrders.forEach((o) => {
    o.items?.forEach((item) => {
      if (!productCountMap[item.product_name]) {
        productCountMap[item.product_name] = { qty: 0, total: 0 };
      }
      productCountMap[item.product_name].qty += item.quantity;
      productCountMap[item.product_name].total += item.subtotal;
    });
  });

  const topProducts = Object.entries(productCountMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const handlePrintCorte = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header (No print) */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Corte de Caja Diario & Arqueo Z
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Resumen de ingresos, desglose por forma de pago y arqueo de turno
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content (Printable) */}
        <div className="p-6 overflow-y-auto space-y-6 printable-ticket text-slate-800 dark:text-slate-200 print:text-black print:p-0">
          {/* Printable Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white print:text-black uppercase">
              {tenant?.name || 'TIENDA TCG'}
            </h2>
            <p className="text-xs font-bold text-emerald-600 print:text-black">
              CORTE DE CAJA DIARIO (REPORTE Z)
            </p>
            <p className="text-[10px] text-slate-500">
              Fecha: {selectedDate} • Generado: {new Date().toLocaleTimeString('es-MX')}
            </p>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">
                Total Vendido
              </span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono">
                ${totalSales.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block">{filteredOrders.length} ventas</span>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase block">
                Efectivo en Caja
              </span>
              <span className="text-lg font-black text-blue-700 dark:text-blue-300 font-mono">
                ${totalCash.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block">{cashOrders.length} cobros</span>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase block">
                Tarjetas / POS
              </span>
              <span className="text-lg font-black text-purple-700 dark:text-purple-300 font-mono">
                ${totalCard.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block">{cardOrders.length} cobros</span>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase block">
                Transferencias
              </span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-300 font-mono">
                ${totalTransfer.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block">{transferOrders.length} cobros</span>
            </div>
          </div>

          {/* Printable Totals Breakdown */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Subtotal Bruto:</span>
              <span>${totalSubtotal.toFixed(2)} MXN</span>
            </div>
            {totalDiscounts > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Total Descuentos Otorgados:</span>
                <span>-${totalDiscounts.toFixed(2)} MXN</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white print:text-black pt-1">
              <span>TOTAL NETO VENDIDO:</span>
              <span className="text-emerald-600 dark:text-emerald-400 print:text-black">
                ${totalSales.toFixed(2)} MXN
              </span>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>💵 Efectivo Físico en Caja:</span>
                <span className="font-bold">${totalCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>💳 Pagos con Tarjeta (Terminal):</span>
                <span className="font-bold">${totalCard.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>📲 Transferencias SPEI / Bancarias:</span>
                <span className="font-bold">${totalTransfer.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Total de Transacciones:</span>
                <span>{filteredOrders.length} tickets</span>
              </div>
            </div>
          </div>

          {/* Top Products of Day */}
          {topProducts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                Artículos Más Vendidos en la Fecha
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                        {p.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white">{p.qty} unids</span>
                      <span className="text-[10px] text-slate-400 block">${p.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List of Tickets of Day */}
          <div className="space-y-2 no-print">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              Detalle de Ventas ({filteredOrders.length})
            </h4>

            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                No se registraron ventas en la fecha seleccionada ({selectedDate}).
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {order.reservation_code}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                          {order.payment_method === 'cash' ? 'Efectivo' : order.payment_method === 'card' ? 'Tarjeta' : 'Transferencia'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                        {order.customer_name} • {order.items?.length || 0} productos
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900 dark:text-white font-mono text-sm">
                        ${order.total.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectTicket(order)}
                        className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Ver ticket e imprimir"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ticket</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions (No print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
          <button
            type="button"
            onClick={handlePrintCorte}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Reporte Z (Corte Diario)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
