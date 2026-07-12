// Navigation items for the sidebar.
// One place to define every link: its translation key, its route and its icon.
// The sidebar just maps over this list, so adding a page = adding one entry here.
import {
  Home,
  Store,
  Library,
  Heart,
  ListChecks,
  BarChart3,
  Users,
  Trophy,
  Settings,
} from "lucide-react";

export const navLinks = [
  { labelKey: "nav.negozio",      href: "/negozio",      icon: Store },
  { labelKey: "nav.libreria",     href: "/libreria",     icon: Library },
  { labelKey: "nav.wishlist",     href: "/wishlist",     icon: Heart },
  { labelKey: "nav.backlog",      href: "/backlog",      icon: ListChecks },
  { labelKey: "nav.statistiche",  href: "/statistiche",  icon: BarChart3 },
  // Achievement: sopra Community (M5-T14)
  { labelKey: "nav.achievement",  href: "/achievement",  icon: Trophy },
  { labelKey: "nav.community",    href: "/community",    icon: Users },
  { labelKey: "nav.impostazioni", href: "/impostazioni", icon: Settings },
];