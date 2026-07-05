// Design system - single import point.
// Lets pages do:  import { Button, Card, StatusBadge } from "@/components";
// instead of reaching into each folder.

export { Button } from "./Button/Button";
export { Card } from "./Card/Card";
export { Badge } from "./Badge/Badge";
export { StatusBadge, GAME_STATUSES } from "./StatusBadge/StatusBadge";
export { Input } from "./Input/Input";
export { Select } from "./Select/Select";
export { Tabs } from "./Tabs/Tabs";
export { Avatar } from "./Avatar/Avatar";
export { Spinner } from "./Spinner/Spinner";
export { LanguageSwitcher } from "./LanguageSwitcher/LanguageSwitcher";
export { Logo } from "./Logo/Logo";
export { NavItem } from "./NavItem/NavItem";
export { SocialLinks } from "./SocialLinks/SocialLinks";