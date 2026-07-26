"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  FileText,
  Users,
  HelpCircle,
  Settings,
  FileEdit,
  Bell,
  UserCog,
  Handshake,
  TrendingUp,
  UserIcon,
  Bed,
  Home,
  ChevronRight,
  CalendarOff,
} from "lucide-react";
import { AllRoles, RoleRoutes } from "@/lib/userRoles";
import { UserRole } from "@/lib/generated/userRoles";

interface SidebarProps {
  userRole?: UserRole;
  collapsed: boolean;
  onExpand?: () => void;
}

export function Sidebar({
  userRole = UserRole.RECEPTIONIST,
  collapsed,
  onExpand,
}: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      title: "Dashboard",
      icon: <BarChart3 className="h-6 w-6" />,
      href: RoleRoutes[userRole],
      roles: [
        UserRole.RECEPTIONIST,
        UserRole.ADMIN,
        UserRole.CONTENT_MANAGER,
        UserRole.THERAPIST,
      ],
    },
    {
      title: "Appointments",
      icon: <Calendar className="h-6 w-6" />,
      href: "/appointments",
      roles: [UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.THERAPIST],
    },
    {
      title: "Invoices",
      icon: <FileText className="h-6 w-6" />,
      href: "/invoices",
      roles: [UserRole.RECEPTIONIST, UserRole.ADMIN],
    },
    {
      title: "Patients",
      icon: <Users className="h-6 w-6" />,
      href: "/patients",
      roles: [UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.THERAPIST],
    },
    {
      title: "Prescriptions",
      icon: <FileText className="h-6 w-6" />,
      href: "/prescriptions",
      roles: [UserRole.THERAPIST, UserRole.ADMIN],
    },
    {
      title: "Blog Management",
      icon: <FileEdit className="h-6 w-6" />,
      href: "/blogs",
      roles: [UserRole.CONTENT_MANAGER, UserRole.ADMIN],
    },
    {
      title: "Announcement",
      icon: <Bell className="h-6 w-6" />,
      href: "/announcement",
      roles: [UserRole.CONTENT_MANAGER, UserRole.ADMIN],
    },
    {
      title: "Employees",
      icon: <UserCog className="h-6 w-6" />,
      href: "/employees",
      roles: [UserRole.ADMIN],
    },
    {
      title: "Analytics",
      icon: <TrendingUp className="h-6 w-6" />,
      href: "/analytics",
      roles: [""],
    },
    {
      title: "Profile",
      icon: <UserIcon className="h-6 w-6" />,
      href: "/profile",
      roles: [
        UserRole.THERAPIST,
        UserRole.CONTENT_MANAGER,
        UserRole.RECEPTIONIST,
        UserRole.ADMIN,
      ],
    },
    {
      title: "Services",
      icon: <Bed className="h-6 w-6" />,
      href: "/services",
      roles: [UserRole.ADMIN],
    },
    {
      title: "Cubicles",
      icon: <Home className="h-6 w-6" />,
      href: "/cubicles",
      roles: [UserRole.ADMIN],
    },
    {
      title: "Holidays",
      icon: <CalendarOff className="h-6 w-6" />,
      href: "/holidays",
      roles: [UserRole.ADMIN],
    },
    {
      title: "Settings",
      icon: <Settings className="h-6 w-6" />,
      href: "/settings",
      roles: [],
    },
    {
      title: "Need Help?",
      icon: <HelpCircle className="h-6 w-6" />,
      href: "/support",
      roles: [
        UserRole.RECEPTIONIST,
        UserRole.ADMIN,
        UserRole.CONTENT_MANAGER,
        UserRole.THERAPIST,
      ],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole),
  );

  const handleMenuClick = () => {
    if (collapsed && onExpand) {
      onExpand();
    }
  };

  return (
    <div className="bg-gradient-to-b from-indigo-800 to-indigo-900 text-white h-full flex flex-col perspective">
      {/* Logo Section */}
      <div
        className={`flex items-center justify-center transition-all duration-500 ease-in-out ${collapsed ? "py-10" : "py-8"}`}
      >
        {!collapsed ? (
          <div className="flex items-center space-x-4 px-6 w-full">
            <div className="h-14 w-14 relative flex-shrink-0 group">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:bg-white/40 transition-all duration-300"></div>
              <Image
                src="/logo.png"
                alt="Theracure Logo"
                fill
                className="object-contain relative z-10 transition-transform duration-500 group-hover:scale-110"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-bold text-2xl tracking-tight truncate bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Theracure
              </span>
              <span className="text-[10px] text-white/40 font-medium tracking-[0.2em] uppercase">
                Clinic Management
              </span>
            </div>
          </div>
        ) : (
          <div
            className="h-14 w-14 relative flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300 group cursor-pointer border border-white/10"
            style={{ perspective: "1000px" }}
          >
            <Image
              src="/logo.png"
              alt="Theracure Logo"
              width={30}
              height={30}
              className="object-contain group-hover:scale-110 transition-all duration-500 ease-out"
              priority
            />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="px-4 mb-2">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        <ul className="space-y-1.5">
          {filteredMenuItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.title} className="fill-mode-both">
                <Link
                  href={item.href}
                  onClick={handleMenuClick}
                  className={`
                    group flex items-center ${collapsed ? "justify-center" : "justify-start"} 
                    px-3 py-2.5 rounded-xl font-medium 
                    transition-all duration-300 relative
                    ${
                      isActive
                        ? "bg-white/15 text-white shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-md border border-white/10"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  {/* Glass highlight effect on hover */}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  )}

                  {/* 3D Glass Popup Card when collapsed */}
                  {collapsed && (
                    <div
                      className={`
                        absolute left-full ml-4 z-50
                        opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                        pointer-events-none group-hover:pointer-events-auto
                        transform group-hover:translate-x-0 -translate-x-2
                      `}
                    >
                      <div
                        className={`
                          bg-white/10 text-white px-5 py-3 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]
                          border border-white/20 backdrop-blur-xl
                          whitespace-nowrap relative flex items-center space-x-4
                        `}
                        style={{
                          transformStyle: "preserve-3d",
                          transform:
                            "perspective(1000px) rotateY(-10deg) translateZ(30px)",
                        }}
                      >
                        <div
                          className={`p-2 rounded-lg ${isActive ? "bg-indigo-500/40" : "bg-white/5"}`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold tracking-wide">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-white/40 flex items-center">
                            Open Section{" "}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </span>
                        </div>

                        {/* Glass Arrow */}
                        <div
                          className="absolute right-full top-1/2 -translate-y-1/2 w-3 h-3 overflow-hidden"
                          style={{ marginRight: "-1px" }}
                        >
                          <div className="absolute left-1/2 top-0 w-full h-full bg-white/10 border border-white/20 backdrop-blur-xl rotate-45 transform origin-left"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={`
                      flex-shrink-0 transition-all duration-500 ease-out relative z-10
                      ${collapsed ? "group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "mr-3 group-hover:scale-110"}
                    `}
                  >
                    {item.icon}
                  </div>

                  {/* Label */}
                  {!collapsed && (
                    <span className="text-sm tracking-wide transition-all duration-300 relative z-10">
                      {item.title}
                    </span>
                  )}

                  {/* Active dot indicator */}
                  {isActive && !collapsed && (
                    <div className="absolute right-3 w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.8)]"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Help Section */}
      <div className={`px-4 py-6 ${collapsed ? "flex justify-center" : ""}`}>
        {!collapsed ? (
          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-4 group cursor-pointer hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform">
                <HelpCircle className="h-4 w-4 text-indigo-300" />
              </div>
              <span className="text-sm font-semibold">Support Center</span>
            </div>
            <p className="text-[10px] text-white/40 mb-3 leading-relaxed font-light">
              Having issues? Our team is available for assistance.
            </p>
            <div className="flex items-center text-[10px] font-bold text-indigo-300 group-hover:text-white transition-colors">
              Contact Us{" "}
              <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ) : (
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-indigo-600/40 transition-all duration-300 group cursor-pointer border border-white/10">
            <HelpCircle className="h-6 w-6 text-white/40 group-hover:text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
