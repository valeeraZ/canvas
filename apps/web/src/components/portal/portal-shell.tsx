import React from "react";
import Link from "next/link";
import {
  AppWindow,
  BookOpen,
  ChevronRight,
  Database,
  LayoutDashboard,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { AppSwitcher } from "./app-switcher";
import { Badge } from "../ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "../ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger
} from "../ui/sidebar";

type PortalShellProps = {
  apps: string[];
  currentApp: string;
  principal?: {
    displayName: string;
    employeeId: string;
    roles: string[];
  } | null;
  title: string;
  description: string;
  currentSection: "overview" | "dashboards" | "datasets" | "workbooks" | "session";
  breadcrumbs: Array<{
    label: string;
    href?: string;
  }>;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function PortalShell(props: PortalShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="gap-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <div className="grid flex-1 text-left">
              <span className="text-sm font-medium">Canvas Portal</span>
              <span className="text-xs text-sidebar-foreground/65">
                Data console
              </span>
            </div>
          </div>
          <div className="px-2">
            <AppSwitcher apps={props.apps} currentApp={props.currentApp} />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Console navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={props.currentSection === "overview"}
                    tooltip="Overview"
                    className="h-10 rounded-xl px-3 text-[15px] font-medium text-sidebar-foreground/78 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent data-active:text-sidebar-foreground data-active:shadow-[inset_0_0_0_1px_var(--color-sidebar-border)]"
                  >
                    <Link href="/portal">
                      <AppWindow />
                      <span>Overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={props.currentSection === "dashboards"}
                    tooltip="Dashboards"
                    className="h-10 rounded-xl px-3 text-[15px] font-medium text-sidebar-foreground/78 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent data-active:text-sidebar-foreground data-active:shadow-[inset_0_0_0_1px_var(--color-sidebar-border)]"
                  >
                    <Link href="/portal/dashboards">
                      <LayoutDashboard />
                      <span>Dashboards</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={props.currentSection === "datasets"}
                    tooltip="Datasets"
                    className="h-10 rounded-xl px-3 text-[15px] font-medium text-sidebar-foreground/78 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent data-active:text-sidebar-foreground data-active:shadow-[inset_0_0_0_1px_var(--color-sidebar-border)]"
                  >
                    <Link href="/portal/datasets">
                      <Database />
                      <span>Datasets</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={props.currentSection === "workbooks"}
                    tooltip="Workbooks"
                    className="h-10 rounded-xl px-3 text-[15px] font-medium text-sidebar-foreground/78 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent data-active:text-sidebar-foreground data-active:shadow-[inset_0_0_0_1px_var(--color-sidebar-border)]"
                  >
                    <Link href="/portal/workbooks">
                      <BookOpen />
                      <span>Workbooks</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={props.currentSection === "session"}
                    tooltip="Session context"
                    className="h-10 rounded-xl px-3 text-[15px] font-medium text-sidebar-foreground/78 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent data-active:text-sidebar-foreground data-active:shadow-[inset_0_0_0_1px_var(--color-sidebar-border)]"
                  >
                    <Link href="/portal">
                      <ShieldCheck />
                      <span>Session context</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <Card size="sm" className="bg-sidebar-accent/40 text-sidebar-foreground ring-sidebar-border">
            <CardHeader className="border-b border-sidebar-border">
              <CardTitle className="text-sm">Current principal</CardTitle>
              <CardDescription className="text-sidebar-foreground/70">
                External authorization snapshot
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-xs">
              <div className="grid gap-1">
                <span className="text-sidebar-foreground/60">Display name</span>
                <span>{props.principal?.displayName ?? "Not signed in"}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-sidebar-foreground/60">Employee ID</span>
                <span>{props.principal?.employeeId ?? "Unavailable"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(props.principal?.roles ?? []).length ? (
                  props.principal?.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">No roles loaded</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              {props.breadcrumbs.map((item, index) => {
                const isLast = index === props.breadcrumbs.length - 1;

                return (
                  <React.Fragment key={`${item.label}-${index}`}>
                    <BreadcrumbItem>
                      {item.href && !isLast ? (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {!isLast ? (
                      <BreadcrumbSeparator>
                        <ChevronRight />
                      </BreadcrumbSeparator>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="grid gap-1">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Active app: {props.currentApp}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {props.title}
              </h1>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {props.description}
              </p>
            </div>
            {props.actions ? (
              <div className="flex items-center gap-2">{props.actions}</div>
            ) : null}
          </div>
          {props.children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
