export type NavigationLocation = "primary" | "secondary" | "footer";

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  location: NavigationLocation;
  position: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
};
