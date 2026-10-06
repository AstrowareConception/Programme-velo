import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://veloquest.vercel.app"),
  title: {
    default: "VeloQuest",
    template: "%s · VeloQuest"
  },
  description: "Programme vélo guidé, progression 12 semaines et gamification.",
  applicationName: "VeloQuest",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg"
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
        {children}
      </body>
    </html>
  );
}
