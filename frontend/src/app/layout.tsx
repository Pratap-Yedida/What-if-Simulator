import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { AuthProvider } from '@/contexts/AuthContext-simple';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster, ToastProvider } from '@/components/ui/Toaster';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'What-If Story Simulator',
  description: 'Interactive storytelling with AI-powered branch generation and collaborative editing',
  keywords: 'storytelling, interactive fiction, AI, writing, collaboration, creative writing',
  authors: [{ name: 'What-If Story Simulator Team' }],
  creator: 'What-If Story Simulator',
  publisher: 'What-If Story Simulator',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://whatif-stories.com',
    title: 'What-If Story Simulator',
    description: 'Interactive storytelling with AI-powered branch generation and collaborative editing',
    siteName: 'What-If Story Simulator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What-If Story Simulator',
    description: 'Interactive storytelling with AI-powered branch generation and collaborative editing',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification tokens here
    // google: 'verification_token',
    // yandex: 'verification_token',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
                {/* Navigation */}
                <Navigation />

                {/* Main Content */}
                <main className="flex-grow">
                  {children}
                </main>

                {/* Footer */}
                <Footer />

                {/* Toast Notifications */}
                <Toaster />
              </div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
