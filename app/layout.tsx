import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nostalgic Requests',
  description: 'DJ Song Request System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0A0A0B] text-white min-h-screen antialiased`}>
        {children}
        <Toaster 
          position="bottom-right" 
          theme="dark"
          richColors
          toastOptions={{
            style: {
              background: '#1A1A1B',
              border: '1px solid #2D2D2D',
              color: '#FFFFFF',
            },
          }}
        />
      </body>
    </html>
  );
}
