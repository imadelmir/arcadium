// Navigation items for the sidebar.
// One place to define every link: its translation key, its route and its icon.
// The sidebar just maps over this list, so adding a page = adding one entry here.
//
// `badge` (change request notifiche) names the counter the sidebar should show
// as a numbered dot on that entry. It is a KEY, not a number: the value lives in
// NotificationsProvider and the sidebar looks it up. This keeps the nav config a
// plain static list — no imports, no state — while still allowing any entry to
// carry a badge later (price drops, unlocked achievements, ...).
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
  // Pallino: richieste di amicizia ricevute e non ancora evase.
  { labelKey: "nav.community",    href: "/community",    icon: Users, badge: "friendRequests" },
  { labelKey: "nav.impostazioni", href: "/impostazioni", icon: Settings },
];