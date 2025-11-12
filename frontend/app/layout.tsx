import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "DAC - Intelligent LLM Routing Platform",
  description: "Enterprise AI routing platform. Operate across LLMs with intelligent provider selection, unified context, and enterprise-grade security.",
  keywords: ["AI", "LLM", "routing", "enterprise", "OpenAI", "Anthropic", "Gemini", "API"],
  authors: [{ name: "DAC Team" }],
  openGraph: {
    title: "DAC - Intelligent LLM Routing Platform",
    description: "Enterprise AI routing platform. Operate across LLMs with intelligent provider selection, unified context, and enterprise-grade security.",
    type: "website",
    url: "https://dac.io",
    images: [
      {
        url: "/icon.svg",
        width: 180,
        height: 180,
        alt: "DAC Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DAC - Intelligent LLM Routing Platform",
    description: "Enterprise AI routing platform with intelligent provider selection and unified context.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "DAC",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Enterprise AI routing platform for intelligent LLM provider selection",
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
