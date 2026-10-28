import React from 'react';
import '../styles/global.css';

export const metadata = {
  title: 'MC&C AFRY - Water Intake Commissioning',
  description: 'Real-time control system for equipment commissioning',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#1f2937" />
      </head>
      <body>
        <header className="app-header">
          <div className="header-content">
            <h1>MC&C AFRY Control System</h1>
            <p>Water Intake Commissioning - Area 5072</p>
          </div>
        </header>
        <main className="app-main">
          {children}
        </main>
        <footer className="app-footer">
          <p>&copy; 2026 AFRY. Sistema de Controle MC&C. v1.0</p>
        </footer>
      </body>
    </html>
  );
}
