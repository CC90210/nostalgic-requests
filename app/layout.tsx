import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://nostalgicrequests.com'),
  title: {
    default: 'Nostalgic Requests | Professional Song Requests for DJs & Bands',
    template: '%s | Nostalgic Requests',
  },
  description: 'Maximize your earnings as a Performer. Accept paid song requests, manage your queue live, and engage your audience like never before. Start for free.',
  keywords: ['DJ requests', 'band song requests', 'paid song requests', 'tipping app', 'musician tools', 'live event software', 'performer revenue'],
  authors: [{ name: 'Nostalgic Requests Team' }],
  creator: 'Nostalgic Requests',
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://nostalgicrequests.com',
    title: 'Nostalgic Requests',
    description: 'The premier platform for paid song requests. Turn requests into revenue.',
    siteName: 'Nostalgic Requests',
    images: [
      {
        url: '/icon.png',
        width: 1200,
        height: 630,
        alt: 'Nostalgic Requests Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nostalgic Requests',
    description: 'Turn requests into revenue. The #1 app for professional performers.',
    creator: '@nostalgicreq',
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0A0A0B] text-white min-h-screen antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
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

