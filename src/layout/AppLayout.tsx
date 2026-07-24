import { Outlet } from "react-router";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { GlobalSearchProvider, useGlobalSearch } from "../context/GlobalSearchContext";
import { cn } from "../utils";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";
import GlobalSearchResult from "../components/search/GlobalSearchResult";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { isActive } = useGlobalSearch();

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />

      <div
        className={cn(
          "flex-1 transition-[margin] duration-300 ease-in-out",
          isExpanded || isHovered ? "xl:ml-[290px]" : "xl:ml-[90px]",
          isMobileOpen ? "ml-0" : "",
        )}
      >
        <AppHeader />
        <main className="mx-auto max-w-(--breakpoint-2xl) p-4 pb-20 md:p-6 md:pb-24">
          {isActive ? <GlobalSearchResult /> : <Outlet />}
        </main>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <GlobalSearchProvider>
        <LayoutContent />
      </GlobalSearchProvider>
    </SidebarProvider>
  );
};

export default AppLayout;
