import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

/**
 * Retorna true si las variables de entorno de Supabase están configuradas con valores válidos.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return false;
  // Descartar placeholders genéricos
  if (url.includes('tu-proyecto') || anonKey.includes('tu-anon-key')) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retorna la instancia singleton del cliente de Supabase para el navegador.
 * Si las credenciales no están configuradas, retorna null de forma segura.
 */
export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      }
    );
  }

  return browserClient;
}
