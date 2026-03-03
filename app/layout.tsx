import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/hooks/useCart";

export const metadata: Metadata = {
    title: "3D Shop",
    description: "Physics-based drag-and-drop shopping cart",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <CartProvider>{children}</CartProvider>
            </body>
        </html>
    );
}
