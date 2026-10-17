import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/context/ThemeContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TCG Ecosystem | Marketplace de Subastas & SaaS ERP para Tiendas',
  description:
    'Ecosistema integral para tiendas de Trading Card Games (Pokémon, Magic, Yu-Gi-Oh!) con inventario universal, escáner de códigos de barra, torneos, reservas web y subastas C2C anti-troll.',
  keywords: ['TCG', 'Pokémon', 'Magic', 'Yu-Gi-Oh!', 'ERP Tiendas', 'POS', 'Subastas TCG', 'Torneos'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
