'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  Gavel,
  ShoppingBag,
  MessageCircle,
  Trophy,
  AlertCircle,
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  Check,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { AppNotification, UserProfile } from '@/types/database';
import { playBeep } from '@/lib/audio';

interface NotificationCenterProps {
  currentUser: UserProfile;
}

export default function NotificationCenter({ currentUser }: NotificationCenterProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Recipient ID is either tenant_id (if store_admin or store_staff) or user.id
  const recipientId =
    currentUser.role === 'store_admin' || currentUser.role === 'store_staff'
      ? currentUser.tenant_id || currentUser.id
      : currentUser.id;

  const loadNotifications = () => {
    if (!recipientId) return;
    const list = dataStore.getNotifications(recipientId);
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();

    const handleNotifChanged = () => {
      loadNotifications();
      if (soundEnabled) {
        playBeep('success');
      }
    };

    window.addEventListener('tcg_notifications_changed', handleNotifChanged);
    return () => window.removeEventListener('tcg_notifications_changed', handleNotifChanged);
  }, [recipientId, soundEnabled]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notif: AppNotification) => {
    dataStore.markNotificationRead(notif.id);
    setIsOpen(false);
    if (notif.link_url) {
      router.push(notif.link_url);
    }
  };

  const handleMarkAllRead = () => {
    if (recipientId) {
      dataStore.markAllNotificationsRead(recipientId);
      loadNotifications();
    }
  };

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'auction_won':
      case 'auction_outbid':
        return <Gavel className="w-4 h-4 text-amber-500" />;
      case 'order_created':
        return <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'new_message':
      case 'offer_received':
        return <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'tournament_alert':
        return <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        title="Bandeja de Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Bandeja de Notificaciones
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-bold text-[10px]">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={soundEnabled ? 'Silenciar alertas' : 'Activar sonido de alertas'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold px-1.5 py-0.5 cursor-pointer"
                >
                  Leer todas
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                No tienes notificaciones pendientes
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition ${
                    !n.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getNotifIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span>{new Date(n.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                      {n.link_url && (
                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5 font-medium">
                          Ver detalle
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
