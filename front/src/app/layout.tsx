import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { NextIntlClientProvider } from "next-intl"
import fa from "@/messages/fa.json"
import './globals.css'


import { Vazirmatn } from "next/font/google";
import { ModalProvider } from "@/lib/modal-context"

const vazir = Vazirmatn({
  subsets: ["arabic"],
  weight: ['300', "400", "500", "700"],
});
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazir.className} style={{ fontWeight: "300" }}>
        <NextIntlClientProvider locale="fa" messages={fa}>


          <SidebarProvider>
            <AppSidebar />
            <main>
              <SidebarTrigger />
              <ModalProvider>
                {children}
              </ModalProvider>
            </main>
          </SidebarProvider>
        </NextIntlClientProvider>
      </body>
    </html >
  )
}