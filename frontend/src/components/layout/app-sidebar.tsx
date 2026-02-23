import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UtensilsCrossed,
  FolderTree,
  Carrot,
  Users,
  ImageIcon,
  ListOrdered,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard },
  { title: "Recipes", to: "/recipes", icon: UtensilsCrossed },
  { title: "Categories", to: "/categories", icon: FolderTree },
  { title: "Ingredients", to: "/ingredients", icon: Carrot },
  { title: "Steps", to: "/steps", icon: ListOrdered },
  { title: "Users", to: "/users", icon: Users },
  { title: "Images", to: "/images", icon: ImageIcon },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <span className="text-lg font-bold">WhatToEat</span>
        <span className="text-xs text-muted-foreground">Admin Panel</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        isActive ? "bg-sidebar-accent font-medium" : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
