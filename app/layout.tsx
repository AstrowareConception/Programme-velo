import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: {
    default: "VeloQuest",
    template: "%s · VeloQuest"
  },
  description: "Programme vélo guidé, progression 12 semaines et gamification.",
  applicationName: "VeloQuest",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VeloQuest"
  }
};

export const viewport: Viewport = {
  themeColor: "#0c1020",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
