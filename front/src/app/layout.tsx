import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { NextIntlClientProvider } from "next-intl"
import fa from "@/messages/fa.json"
import './globals.css'


import { Vazirmatn } from "next/font/google";
import { ModalProvider } from "@/lib/modal-context"
import { CoreDataProvider } from "@/lib/core-data-context"
import { ToastProvider } from "@/components/providers/toast-provider"

const vazir = Vazirmatn({
  subsets: ["arabic"],
  weight: ['300', "400", "500", "700"],
});
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazir.className} style={{ fontWeight: "300" }}>
        <NextIntlClientProvider locale="fa" messages={fa}>
          <CoreDataProvider>
            <ModalProvider>
              <SidebarProvider>
                <AppSidebar />
                <main className="p-5 pt-[5vh] w-full">
                  {children}
                </main>
              </SidebarProvider>
            </ModalProvider>
            <ToastProvider />
          </CoreDataProvider>
        </NextIntlClientProvider>
      </body>
    </html >
  )
}