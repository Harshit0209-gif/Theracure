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
} from "lucide-react";
import { AllRoles, RoleRoutes } from "@/lib/userRoles";
import { UserRole } from "@prisma/client";

interface SidebarProps {
  userRole?: (typeof AllRoles)[number];
  collapsed: boolean;
}

export function Sidebar({
  userRole = UserRole.RECEPTIONIST,
  collapsed,
}: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    // Receptionist & Admin Items
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
      title: "Consultation",
      icon: <Handshake className="h-6 w-6" />,
      href: "/consultation",
      roles: [UserRole.RECEPTIONIST, UserRole.ADMIN],
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
    item.roles.includes(userRole)
  );

  return (
    <div className="bg-gradient-to-b from-indigo-800 to-indigo-900 text-white h-full flex flex-col">
      <div className="p-4 flex items-center justify-center">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 relative">
              <Image
                src="/logo.png"
                alt="Theracure Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-bold text-lg">Theracure</span>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 relative mx-auto">
            <Image
              src="/logo.png"
              alt="Theracure Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        )}
      </div>

      <nav className="flex-1 pt-4">
        <ul className="space-y-1 px-2">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  }`}
                >
                  {item.icon}
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
