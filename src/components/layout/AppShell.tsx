import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Package, ShoppingCart, Wallet, Users, FileText,
  Truck, Inbox, BarChart3, Settings, LogOut, Building2, UserCog
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; ownerOnly?: boolean };
const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/debts", label: "Debts", icon: Wallet },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/proformas", label: "Proformas", icon: FileText },
  { to: "/delivery-notes", label: "Delivery", icon: Truck },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/employees", label: "Employees", icon: UserCog, ownerOnly: true },
  { to: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_NAV = NAV.slice(0, 5);

export function AppShell() {
  const { user, signOut } = useAuth();
  const { active, businesses, setActive, isOwner } = useBusiness();
  const navigate = useNavigate();
  const path = useRouterState({ select: s => s.location.pathname });

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card">
        <div className="p-5 border-b">
          <h1 className="font-bold text-lg tracking-tight">CURUZA</h1>
          <p className="text-xs text-muted-foreground">Quincalleries</p>
        </div>
        <div className="p-3 border-b">
          <Select value={active?.id ?? ""} onValueChange={(v) => setActive(v)}>
            <SelectTrigger className="w-full">
              <Building2 className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Select shop" />
            </SelectTrigger>
            <SelectContent>
              {businesses.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV.filter(n => !n.ownerOnly || isOwner).map(n => {
            const Icon = n.icon;
            const active2 = path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to as string}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${active2 ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                <Icon className="h-4 w-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t text-xs">
          <p className="text-muted-foreground truncate mb-2">{user?.email}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut className="h-3 w-3 mr-2" />Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-3 border-b bg-card sticky top-0 z-30">
          <div>
            <h1 className="font-bold text-base">CURUZA</h1>
            <p className="text-[10px] text-muted-foreground">{active?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={active?.id ?? ""} onValueChange={(v) => setActive(v)}>
              <SelectTrigger className="h-9 w-32 text-xs"><SelectValue placeholder="Shop" /></SelectTrigger>
              <SelectContent>{businesses.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="icon" variant="ghost" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-x-hidden"><Outlet /></main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-card z-30 grid grid-cols-5">
          {MOBILE_NAV.map(n => {
            const Icon = n.icon;
            const active2 = path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to as string}
                className={`flex flex-col items-center py-2 text-[10px] ${active2 ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className="h-5 w-5 mb-0.5" />{n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}