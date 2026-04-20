import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "SureVision AI",
  description: "Enterprise AI decision intelligence for risk, compliance, operations, and executive strategy.",
  icons: {
    icon: "/favicon.svg"
  }
};

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy-client-id-replace-me";

  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <GoogleOAuthProvider clientId={clientId}>
          {children}
        </GoogleOAuthProvider>
        <Toaster richColors position="top-right" theme="dark" />
      </body>
    </html>
  );
}
