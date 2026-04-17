import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans, Outfit, DM_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { cn } from "@/lib/utils";

const fontInter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const fontJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });
const fontOutfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const fontDMSans = DM_Sans({ subsets: ['latin'], variable: '--font-dmsans' });

export const metadata: Metadata = {
  title: 'TapConnect | Smart Digital Identity',
  description: 'Tap. Connect. Share Instantly. TapConnect turns your NFC card into a powerful digital identity.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", fontInter.variable, fontJakarta.variable, fontOutfit.variable, fontDMSans.variable)}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let chart = localStorage.getItem('app-chart-theme');
                if (chart) document.documentElement.dataset.chart = chart;
                
                let font = localStorage.getItem('app-font');
                if (font === 'Inter') document.documentElement.dataset.font = 'inter';
                else if (font === 'Jakarta') document.documentElement.dataset.font = 'jakarta';
                else if (font === 'Outfit') document.documentElement.dataset.font = 'outfit';
                else if (font === 'DM Sans') document.documentElement.dataset.font = 'dmsans';
                
                let accent = localStorage.getItem('app-accent');
                if (accent) {
                  document.documentElement.style.setProperty('--primary', accent);
                  document.documentElement.style.setProperty('--ring', accent);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased bg-background text-foreground transition-colors duration-300">
        <Analytics />
        <SpeedInsights />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
