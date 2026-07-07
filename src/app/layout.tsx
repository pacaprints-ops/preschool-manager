import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito } from "next/font/google";
import Providers from "@/components/providers";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const title = "Winton Pre-School Little Explorers";
const description = "A warm, nurturing pre-school in Bournemouth for children aged 2–5. Government-funded places available.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: {
    title,
    description,
    url: SITE_URL,
    siteName: title,
    images: ["/images/staff.jpeg"],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/staff.jpeg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ChildCare",
  name: title,
  description,
  url: SITE_URL,
  image: `${SITE_URL}/images/staff.jpeg`,
  telephone: "+447305240440",
  email: "info@wintonpreschool.org.uk",
  address: {
    "@type": "PostalAddress",
    streetAddress: "St Bernadette's Church Hall, 46 Draycott Rd",
    addressLocality: "Bournemouth",
    postalCode: "BH10 5AR",
    addressCountry: "GB",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "15:00",
  },
  priceRange: "££",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
