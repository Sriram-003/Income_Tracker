'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Home,
  Users,
  Package,
  Download,
  LogOut,
  CreditCard,
} from 'lucide-react';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import placeholderData from '@/lib/placeholder-images.json';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/accounts', label: 'Accounts', icon: Users },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/billing', label: 'Billing', icon: FileText },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/reports', label: 'Reports', icon: Download },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { placeholderImages } = placeholderData;
  const adminAvatar = placeholderImages.find(
    (img: ImagePlaceholder) => img.id === 'admin-avatar'
  );

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full bg-sidebar-accent text-sidebar-foreground group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8"
              asChild
            >
              <Link href="/dashboard">
                <Icons.logo className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                Track income
              </h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="group-data-[collapsible=icon]:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto w-full justify-start p-2">
                <div className="flex w-full items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {adminAvatar && (
                      <AvatarImage
                        src={adminAvatar.imageUrl}
                        alt="Admin"
                        data-ai-hint={adminAvatar.imageHint}
                      />
                    )}
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <p className="text-sm font-medium text-sidebar-foreground">
                      Admin
                    </p>
                    <p className="text-xs text-sidebar-foreground/70">
                      sriramvenkat2304@gmail.com
                    </p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="flex md:hidden" />
          <div className="flex-1">
            <h1 className="hidden text-lg font-semibold md:block">
              {menuItems.find((item) => pathname.startsWith(item.href))?.label ||
                'Dashboard'}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
