import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Cabecera de cada página dentro del SidebarInset: trigger, ruta y acciones a la derecha.
export function PageHeader({
  group,
  title,
  subtitle,
  children,
}: {
  group?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          {group && (
            <>
              <BreadcrumbItem className="hidden md:block">{group}</BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
            </>
          )}
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate font-medium">{title}</BreadcrumbPage>
          </BreadcrumbItem>
          {subtitle && <li className="hidden truncate pl-2 text-xs text-muted-foreground lg:block">{subtitle}</li>}
        </BreadcrumbList>
      </Breadcrumb>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </header>
  );
}
