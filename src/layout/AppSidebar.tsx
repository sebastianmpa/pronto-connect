import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import { useSidebar } from "../context/SidebarContext";
import {
  // AiIcon,
  // BoxCubeIcon,
  // CalenderIcon,
  CallIcon,
  // CartIcon,
  // ChatIcon,
  ChevronDownIcon,
  // GridIcon,
  // HorizontaLDots,
  HorizontaLDots,
  // LayoutIcon,
  ListIcon,
  KeyIcon,
  MailIcon,
  EmailAltIcon,
  CloseLineIcon,
  CheckCircleIcon,
  // MapIcon,
  // PageIcon,
  // PieChartIcon,
  // PlugInIcon,
  TableIcon,
  GroupIcon,
  // TaskIcon,
  UserCircleIcon,
  MultiUserIcon,
} from "../icons";
import { cn } from "../utils";
import SidebarWidget from "./SidebarWidget";
import GlobalSearch from "../components/search/GlobalSearch";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  new?: boolean;
  target?: string;
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    target?: string;
  }[];
};

const navItems: NavItem[] = [
  {
    icon: <GroupIcon />,
    name: "Customers",
    path: "/customers",
  },
  {
    icon: <GroupIcon />,
    name: "Customer Contacts",
    path: "/customer-contacts",
  },
  {
    icon: <TableIcon />,
    name: "Orders",
    path: "/orders",
  },
  {
    icon: <TableIcon />,
    name: "SMS Logs",
    path: "/sms-logs",
  },
  {
    icon: <MailIcon />,
    name: "SMS Templates",
    path: "/sms-templates",
  },
  {
    icon: <EmailAltIcon />,
    name: "Email Templates",
    path: "/email-templates",
  },
  {
    icon: <CallIcon />,
    name: "Tickets",
    path: "/tickets",
  },
  {
    icon: <CloseLineIcon />,
    name: "Cancellations",
    path: "/cancellations",
  },
  {
    icon: <CheckCircleIcon />,
    name: "Closure Methods",
    path: "/closure-methods",
  },
  {
    icon: <ListIcon />,
    name: "Contact Reasons",
    path: "/contact-reasons",
  },
  {
    icon: <KeyIcon />,
    name: "Permissions",
    path: "/permissions",
  },
  {
    icon: <UserCircleIcon />,
    name: "Roles",
    path: "/roles",
  },
  {
    icon: <MultiUserIcon />,
    name: "Users",
    path: "/users",
  },
];

/* ── The items below are temporarily disabled ───────────────────────────────
const _disabledNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [
      { name: "Ecommerce", path: "/" },
      { name: "Analytics", path: "/analytics" },
      { name: "Marketing", path: "/marketing" },
      { name: "CRM", path: "/crm" },
      { name: "Stocks", path: "/stocks" },
      { name: "SaaS", path: "/saas" },
      { name: "Logistics", path: "/logistics" },
      { name: "AI", path: "/ai", new: true },
      { name: "Sales", path: "/sales", new: true },
      { name: "Finance", path: "/finance", new: true },
    ],
  },
  {
    name: "AI Assistant",
    icon: <AiIcon />,
    new: true,
    subItems: [
      { name: "Text Generator", path: "/text-generator" },
      { name: "Image Generator", path: "/image-generator" },
      { name: "Code Generator", path: "/code-generator" },
      { name: "Video Generator", path: "/video-generator" },
      { name: "AI Settings", path: "/ai-settings" },
    ],
  },
  {
    name: "E-commerce",
    icon: <CartIcon />,
    new: false,
    subItems: [
      { name: "Products", path: "/products-list" },
      { name: "Add Product", path: "/add-product" },
      { name: "Billing", path: "/billing" },
      { name: "Invoices", path: "/invoices" },
      { name: "Single Invoice", path: "/single-invoice" },
      { name: "Create Invoice", path: "/create-invoice" },
      { name: "Transactions", path: "/transactions" },
      { name: "Single Transaction", path: "/single-transaction" },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/calendar",
  },
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/profile",
  },
  {
    name: "Task",
    icon: <TaskIcon />,
    subItems: [
      { name: "List", path: "/task-list", pro: true },
      { name: "Kanban", path: "/task-kanban", pro: true },
    ],
  },
  {
    name: "Forms",
    icon: <ListIcon />,
    subItems: [
      { name: "Form Elements", path: "/form-elements", pro: false },
      { name: "Form Layout", path: "/form-layout", pro: true },
    ],
  },
  {
    name: "Tables",
    icon: <TableIcon />,
    subItems: [
      { name: "Basic Tables", path: "/basic-tables", pro: false },
      { name: "Data Tables", path: "/data-tables", pro: true },
    ],
  },
  {
    name: "Pages",
    icon: <PageIcon />,
    subItems: [
      { name: "File Manager", path: "/file-manager" },
      { name: "Pricing Tables", path: "/pricing-tables" },
      { name: "FAQ", path: "/faq" },
      { name: "API Keys", path: "/api-keys", new: true },
      { name: "Integrations", path: "/integrations", new: true },
      { name: "Blank Page", path: "/blank" },
      { name: "404 Error", path: "/error-404" },
      { name: "500 Error", path: "/error-500" },
      { name: "503 Error", path: "/error-503" },
      { name: "Coming Soon", path: "/coming-soon" },
      { name: "Maintenance", path: "/maintenance" },
      { name: "Success", path: "/success" },
    ],
  },
  {
    name: "Layouts",
    icon: <LayoutIcon />,
    new: true,
    subItems: [
      { name: "Layout One", path: "/layout-one", target: "_blank" },
      { name: "Layout Two", path: "/layout-two", target: "_blank" },
      { name: "Layout Three", path: "/layout-three", target: "_blank" },
      { name: "Layout Four", path: "/layout-four", target: "_blank" },
      { name: "Layout Five", path: "/layout-five", target: "_blank" },
      { name: "Layout Six", path: "/layout-six", target: "_blank" },
    ],
  },
];
── */

const othersItems: NavItem[] = [];

/* ── Disabled others items ────────────────────────────────────────────────────
const _disabledOthersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Charts",
    new: true,
    subItems: [
      { name: "Line Chart", path: "/line-chart" },
      { name: "Bar Chart", path: "/bar-chart" },
      { name: "Pie Chart", path: "/pie-chart" },
      { name: "Radar Chart", path: "/radar-chart" },
      { name: "Radial Chart", path: "/radial-chart" },
    ],
  },
  {
    icon: <MapIcon />,
    name: "Maps",
    new: true,
    subItems: [
      { name: "Maps", path: "/maps" },
      { name: "Vector Map", path: "/vector-map" },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts", pro: false },
      { name: "Avatar", path: "/avatars", pro: false },
      { name: "Badge", path: "/badge", pro: false },
      { name: "Breadcrumb", path: "/breadcrumb", pro: false },
      { name: "Buttons", path: "/buttons", pro: false },
      { name: "Buttons Group", path: "/buttons-group", pro: false },
      { name: "Cards", path: "/cards", pro: false },
      { name: "Carousel", path: "/carousel", pro: false },
      { name: "Dropdowns", path: "/dropdowns", pro: false },
      { name: "Images", path: "/images", pro: false },
      { name: "Links", path: "/links", pro: false },
      { name: "List", path: "/list", pro: false },
      { name: "Modals", path: "/modals", pro: false },
      { name: "Notification", path: "/notifications", pro: false },
      { name: "Pagination", path: "/pagination", pro: false },
      { name: "Popovers", path: "/popovers", pro: false },
      { name: "Progressbar", path: "/progress-bar", pro: false },
      { name: "Ribbons", path: "/ribbons", pro: false },
      { name: "Spinners", path: "/spinners", pro: false },
      { name: "Tabs", path: "/tabs", pro: false },
      { name: "Tooltips", path: "/tooltips", pro: false },
      { name: "Videos", path: "/videos", pro: false },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
      { name: "Reset Password", path: "/reset-password", pro: false },
      {
        name: "Two Step Verification",
        path: "/two-step-verification",
        pro: false,
      },
    ],
  },
];
── */

const supportItems: NavItem[] = [];

/* ── Disabled support items ───────────────────────────────────────────────────
const _disabledSupportItems: NavItem[] = [
  {
    icon: <ChatIcon />,
    name: "Chat",
    path: "/chat",
  },
  {
    icon: <CallIcon />,
    name: "Support Ticket",
    new: true,
    subItems: [
      { name: "Ticket List", path: "/support-tickets" },
      { name: "Ticket Reply", path: "/support-ticket-reply" },
    ],
  },
  {
    icon: <MailIcon />,
    name: "Email",
    subItems: [
      { name: "Inbox", path: "/inbox" },
      { name: "Details", path: "/inbox-details" },
    ],
  },
];
── */

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } =
    useSidebar();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "support" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-close sidebar on mobile after route change
  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  useEffect(() => {
    let submenuMatched = false;

    ["main", "support", "others"].forEach((menuType) => {
      const items =
        menuType === "main"
          ? navItems
          : menuType === "support"
            ? supportItems
            : othersItems;

      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "support" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (
    index: number,
    menuType: "main" | "support" | "others",
  ) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (
    items: NavItem[],
    menuType: "main" | "support" | "others",
  ) => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`group menu-item ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "xl:justify-center"
                  : "xl:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {nav.new && (isExpanded || isHovered || isMobileOpen) && (
                <span
                  className={`absolute right-10 ml-auto ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "menu-dropdown-badge-active"
                      : "menu-dropdown-badge-inactive"
                  } menu-dropdown-badge`}
                >
                  new
                </span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto h-5 w-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                target={nav.target}
                className={`group menu-item ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 ml-9 space-y-1">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      target={subItem.target}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="ml-auto flex items-center gap-1">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-pro-active"
                                : "menu-dropdown-badge-pro-inactive"
                            } menu-dropdown-badge-pro`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out xl:translate-x-0 dark:border-gray-800 dark:bg-gray-900",
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "flex py-8",
          !isExpanded && !isHovered ? "xl:justify-center" : "justify-start",
        )}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <img
              src="/images/logo/logo1.png"
              alt="Pronto Connect"
              width={160}
              height={60}
              className="object-contain"
            />
          ) : (
            <img
              src="/images/logo/logo1.png"
              alt="Pronto Connect"
              width={40}
              height={40}
              className="object-contain"
            />
          )}
        </Link>
      </div>

      <GlobalSearch />

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 flex text-xs leading-[20px] text-gray-400 uppercase ${
                  !isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>

        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
