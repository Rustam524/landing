import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALGORITM — рабочее пространство",
  description: "Внутренняя система управления сотрудниками, проектами и задачами агентства ALGORITM",
  icons: { icon: "/brand/logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
