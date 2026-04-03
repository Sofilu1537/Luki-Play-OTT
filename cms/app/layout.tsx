import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luki Play — Panel Administrativo',
  description: 'CMS administrativo de Luki Play OTT',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
