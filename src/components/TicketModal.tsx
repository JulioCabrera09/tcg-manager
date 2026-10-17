'use client';

import React from 'react';
import Image from 'next/image';
import {
  Printer,
  Share2,
  X,
  CheckCircle2,
  Receipt,
  Store,
  Calendar,
  User,
  CreditCard,
  Banknote,
  Send,
  Sparkles,
} from 'lucide-react';
import { Order, Tenant } from '@/types/database';

interface TicketModalProps {
  order: Order | null;
  tenant: Tenant | null;
  onClose: () => void;
  onNewSale?: () => void;
}

export default function TicketModal({
  order,
  tenant,
  onClose,
  onNewSale,
}: TicketModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.created_at).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const generateWhatsAppTicketText = () => {
    const storeName = tenant?.name || 'Tienda de TCG';
    const lines = [
      `*🧾 COMPROBANTE DE COMPRA - ${storeName.toUpperCase()}*`,
      `*Folio:* ${order.reservation_code}`,
      `*Fecha:* ${formattedDate}`,
      `*Cliente:* ${order.customer_name}`,
      `---------------------------------`,
      `*DETALLE DE ARTÍCULOS:*`,
    ];

    order.items?.forEach((i) => {
      lines.push(`• ${i.quantity}x ${i.product_name} - $${i.subtotal.toFixed(2)} MXN`);
    });

    lines.push(`---------------------------------`);
    lines.push(`*Subtotal:* $${order.subtotal.toFixed(2)} MXN`);
    if (order.discount_amount && order.discount_amount > 0) {
      lines.push(`*Descuento:* -$${order.discount_amount.toFixed(2)} MXN`);
    }
    lines.push(`*TOTAL PAGADO:* $${order.total.toFixed(2)} MXN`);
    lines.push(`*Método de pago:* ${order.payment_method === 'cash' ? 'Efectivo' : order.payment_method === 'card' ? 'Tarjeta' : 'Transferencia'}`);
    
    if (order.amount_paid && order.amount_paid > 0) {
      lines.push(`*Pagó con:* $${order.amount_paid.toFixed(2)} MXN`);
      lines.push(`*Cambio:* $${(order.change_given || 0).toFixed(2)} MXN`);
    }

    lines.push(`---------------------------------`);
    lines.push(`¡Gracias por tu compra en ${storeName}!`);
    return encodeURIComponent(lines.join('\n'));
  };

  const handleSendWhatsApp = () => {
    const phone = order.customer_phone && order.customer_phone !== 'Mostrador' && order.customer_phone !== 'N/A'
      ? order.customer_phone.replace(/\D/g, '')
      : (tenant?.whatsapp || tenant?.phone || '').replace(/\D/g, '');

    const url = phone.length >= 10
      ? `https://wa.me/52${phone.slice(-10)}?text=${generateWhatsAppTicketText()}`
      : `https://wa.me/?text=${generateWhatsAppTicketText()}`;

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
      {/* Container with print styles */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Top Action Bar (Hidden on print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Comprobante de Venta Térmico
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-[11px] text-slate-800 dark:text-slate-200 print:text-black print:bg-white print:p-0 print:m-0 printable-ticket">
          {/* Ticket Header */}
          <div className="text-center space-y-1.5 pb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
            {tenant?.logo_url && (
              <div className="w-14 h-14 mx-auto rounded-xl overflow-hidden bg-white border border-slate-200 mb-2 print:border-none">
                <Image
                  src={tenant.logo_url}
                  alt={tenant.name}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white print:text-black uppercase">
              {tenant?.name || 'TCG ECOSYSTEM STORE'}
            </h2>
            {tenant?.tagline && (
              <p className="text-[10px] text-slate-500 print:text-slate-600">{tenant.tagline}</p>
            )}
            {tenant?.address && (
              <p className="text-[10px] text-slate-500 print:text-slate-600 max-w-xs mx-auto leading-tight">
                {tenant.address}
              </p>
            )}
            {tenant?.phone && (
              <p className="text-[10px] text-slate-500 print:text-slate-600">Tel: {tenant.phone}</p>
            )}
          </div>

          {/* Ticket Info */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Folio:</span>
              <span className="font-bold text-slate-900 dark:text-white print:text-black">{order.reservation_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha y Hora:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cajero:</span>
              <span>{order.cashier_name || 'Cajero en Turno'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente:</span>
              <span className="font-bold truncate max-w-[180px]">{order.customer_name}</span>
            </div>
            {order.customer_phone && order.customer_phone !== 'Mostrador' && order.customer_phone !== 'N/A' && (
              <div className="flex justify-between">
                <span className="text-slate-500">Teléfono:</span>
                <span>{order.customer_phone}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-2">
            <div className="grid grid-cols-12 text-[9px] font-bold uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1">
              <span className="col-span-2">Cant</span>
              <span className="col-span-7">Descripción</span>
              <span className="col-span-3 text-right">Importe</span>
            </div>

            {order.items?.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 text-[11px] leading-snug">
                <span className="col-span-2 font-bold">{item.quantity}x</span>
                <div className="col-span-7 pr-1">
                  <p className="font-semibold text-slate-900 dark:text-white print:text-black truncate">
                    {item.product_name}
                  </p>
                  {item.variation_info && (
                    <span className="text-[9px] text-slate-500 block">{item.variation_info}</span>
                  )}
                  <span className="text-[9px] text-slate-400 block">${item.unit_price.toFixed(2)} c/u</span>
                </div>
                <span className="col-span-3 text-right font-bold">${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals & Payments */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>

            {order.discount_amount && order.discount_amount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Descuento aplicado:</span>
                <span>-${order.discount_amount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white print:text-black pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>TOTAL A PAGAR:</span>
              <span className="font-bold">${order.total.toFixed(2)} MXN</span>
            </div>

            <div className="pt-2 text-[10px] space-y-1 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Método de Pago:</span>
                <span className="font-bold uppercase">
                  {order.payment_method === 'cash'
                    ? '💵 Efectivo'
                    : order.payment_method === 'card'
                    ? '💳 Tarjeta / Terminal'
                    : order.payment_method === 'transfer'
                    ? '📲 Transferencia / SPEI'
                    : 'Contra entrega'}
                </span>
              </div>

              {order.payment_method === 'cash' && order.amount_paid !== undefined && order.amount_paid > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Efectivo Recibido:</span>
                    <span>${order.amount_paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 print:text-black text-xs">
                    <span>Cambio Entregado:</span>
                    <span>${(order.change_given || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Ticket Footer Notes */}
          <div className="pt-4 text-center space-y-1 text-[9px] text-slate-500">
            <p className="font-bold text-slate-700 dark:text-slate-300 print:text-black">
              ¡Gracias por tu preferencia y apoyar a tu comunidad TCG!
            </p>
            <p>Conserva este comprobante para aclaraciones o torneos.</p>
            <p className="text-[8px] text-slate-400">
              TCG Ecosystem ERP • Sistema de Gestión y Ventas Multi-Tienda
            </p>
          </div>
        </div>

        {/* Modal Bottom Action Controls (Hidden on Print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-2 no-print">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket (80mm)</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Cliente</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onNewSale) onNewSale();
              onClose();
            }}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Nueva Venta / Cerrar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
