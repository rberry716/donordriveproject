import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
    title: "Dance Marathon Live",
    description: "Live donation display for CMN Dance Marathon events",
};

const barlowCondensed = Barlow_Condensed({
    subsets: ["latin"],
    variable: "--font-barlow-condensed",
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
    subsets: ["latin"],
    variable: "--font-ibm-plex-sans",
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    variable: "--font-ibm-plex-mono",
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${barlowCondensed.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
                {children}
            </body>
        </html>
    );
}
