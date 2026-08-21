import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk, Sora } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import { Toaster } from '@/components/ui/sonner';
import { AIAssistant } from '@/components/ai-assistant';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({ 
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const mono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'AI Surveillance Platform | Intelligent Threat Detection',
    template: '%s | AI Surveillance Platform',
  },
  description: 'Next-generation AI-powered surveillance system with real-time threat detection, suspicious behavior analysis, and enterprise-grade security monitoring.',
  keywords: [
    'AI surveillance',
    'threat detection',
    'security monitoring',
    'computer vision',
    'real-time analytics',
    'smart city',
    'public safety',
  ],
  authors: [{ name: 'AI Surveillance Team' }],
  creator: 'AI Surveillance Platform',
  publisher: 'AI Surveillance Platform',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ai-surveillance.com',
    siteName: 'AI Surveillance Platform',
    title: 'AI Surveillance Platform | Intelligent Threat Detection',
    description: 'Next-generation AI-powered surveillance system with real-time threat detection.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AI Surveillance Platform Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Surveillance Platform',
    description: 'Next-generation AI-powered surveillance system with real-time threat detection.',
    images: ['/images/twitter-image.jpg'],
    creator: '@aisurveillance',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#00d4ff',
      },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a0a0f' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${inter.variable} ${sora.variable} ${mono.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-cyber-dark text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            <div className="relative min-h-screen">
              {/* Animated Background */}
              <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 cyber-grid-bg opacity-30" />
                
                {/* Gradient Orbs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-blue/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyber-purple/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyber-pink/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
              </div>
              
              {/* Main Content */}
              <main className="relative z-10">
                {children}
              </main>
              
              {/* AI Voice Assistant */}
              <AIAssistant />
              
              {/* Toast Notifications */}
              <Toaster 
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'rgba(10, 10, 15, 0.95)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    color: '#fff',
                  },
                }}
              />
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
