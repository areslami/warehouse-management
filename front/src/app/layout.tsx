import { SidebarProvider, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar"
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
                <SidebarRail />
                <SidebarInset>
                  <header className="sticky top-0 z-40 flex h-12 items-center justify-end gap-2 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4">
                    <SidebarTrigger />
                  </header>
                  <div className="p-5">
                    {children}
                  </div>
                </SidebarInset>
              </SidebarProvider>
            </ModalProvider>
            <ToastProvider />
          </CoreDataProvider>
        </NextIntlClientProvider>
      </body>
    </html >
  )
}
