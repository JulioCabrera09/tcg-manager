import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware para Enrutamiento Multi-Tenant por Subdominios
 * - Si el host es un subdominio de tienda (ej: omega-tcg.localhost:3000 o omega-tcg.dominio.com),
 *   reescribe automáticamente la petición al storefront público de esa tienda (/tienda/[slug]).
 * - Si es el dominio principal (localhost:3000, dominio.com, www.dominio.com), continúa con las rutas estándar.
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Excluir archivos estáticos internos de Next.js, APIs e imágenes
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extraer subdominio eliminando el puerto si existe
  const hostWithoutPort = hostname.split(':')[0];
  let subdomain: string | null = null;

  if (hostWithoutPort.includes('localhost')) {
    const parts = hostWithoutPort.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      subdomain = parts[0];
    }
  } else {
    const parts = hostWithoutPort.split('.');
    // ej. [slug, midominio, com] -> parts.length >= 3
    if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'admin') {
      subdomain = parts[0];
    }
  }

  // Si existe un subdominio no reservado, reescribir a la tienda
  const reservedSubdomains = ['www', 'api', 'admin', 'app', 'mail', 'static', 'assets'];
  if (subdomain && !reservedSubdomains.includes(subdomain.toLowerCase())) {
    // Si la ruta ya empieza con /tienda/[subdomain], no volver a prefijar
    if (url.pathname.startsWith(`/tienda/${subdomain}`)) {
      return NextResponse.next();
    }

    const rewritePath = url.pathname === '/' 
      ? `/tienda/${subdomain}` 
      : `/tienda/${subdomain}${url.pathname}`;

    const rewriteUrl = new URL(rewritePath, req.url);
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
