import NavBar from "@/components/nav-bar";
import Footer from "@/components/footer";
import { AnnouncementBanner } from "./page";

export default function RootGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnnouncementBanner />
        <NavBar />
      </div>

      <main className="flex-1 pt-[calc(2.5rem+3.5rem)]">{children}</main>
      <Footer />
    </div>
  );
}
