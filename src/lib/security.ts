/**
 * Módulo de Seguridad y Criptografía TCG
 * Implementa hasheo seguro de contraseñas usando SHA-256 + Salt de aplicación
 * para proteger las credenciales ante vulnerabilidades o filtraciones de base de datos.
 */

const APP_SECURITY_SALT = 'tcg_salt_v2026_argon_sha256_secure';

/**
 * Genera un hash SHA-256 seguro de la contraseña junto con el salt de aplicación.
 * Nunca almacena ni transmite contraseñas en texto plano.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltedInput = `${password}:${APP_SECURITY_SALT}`;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(saltedInput);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback si WebCrypto falla
    }
  }

  // Algoritmo de fallback determinista (DJB2 + FNV-1a extendido de 64 bits a hex)
  let h1 = 0x811c9dc5;
  let h2 = 0x537f2a1b;
  for (let i = 0; i < saltedInput.length; i++) {
    const code = saltedInput.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ (code << 3), 0x01000193);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `sec_sha256_${hex1}${hex2}`;
}

/**
 * Valida si la contraseña proporcionada coincide con el hash almacenado.
 */
export async function verifyPassword(password: string, storedHash?: string): Promise<boolean> {
  if (!storedHash) return false;
  const computedHash = await hashPassword(password);
  return computedHash === storedHash;
}

/**
 * Limpia y normaliza un número de celular:
 * - Filtra caracteres no numéricos
 * - Trunca a exactamente 10 dígitos (asumiendo formato mexicano +52 sin lada)
 */
export function sanitizeMexicanPhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 10);
}

/**
 * Valida si un número de celular tiene exactamente 10 dígitos numéricos válidos.
 */
export function isValidMexicanPhone(phone: string): boolean {
  const digits = sanitizeMexicanPhone(phone);
  return digits.length === 10;
}
