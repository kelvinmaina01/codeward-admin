import {
  DashboardSquare01Icon,
  UserGroupIcon,
  Alert01Icon,
  Settings01Icon,
  Analytics01Icon,
  UserListIcon,
  Building01Icon,
  Clock01Icon,
  Ticket01Icon,
  ChartAverageIcon,
  StarAward01Icon,
  FolderManagementIcon,
  Dollar01Icon,
  Wallet01Icon,
  InboxIcon,
  Mail01Icon,
  MailEdit02Icon,
  SentIcon,
} from "hugeicons-react";

export type SecondaryLink = {
  label: string;
  href: string;
  end?: boolean;
  badge?: number;
  icon?: React.ElementType;
};

export type SecondaryGroup = {
  id: string;
  label: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  links: SecondaryLink[];
};

export type PrimaryItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  end?: boolean;
  panelTitle: string;
  panelSubtitle: string;
  groups: SecondaryGroup[];
};

export const primaryNav: PrimaryItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/",
    icon: DashboardSquare01Icon,
    end: true,
    panelTitle: "Codeward",
    panelSubtitle: "Platform health & KPIs",
    groups: [
      {
        id: "general",
        label: "Dashboard",
        links: [
          { label: "Platform Overview", href: "/", end: true, icon: DashboardSquare01Icon },
          { label: "Users Analytics", href: "/users", icon: Analytics01Icon },
        ],
      },
      {
        id: "reports",
        label: "Reports",
        collapsible: true,
        defaultOpen: true,
        links: [
          { label: "User growth", href: "/users", icon: ChartAverageIcon },
          { label: "Activity stream", href: "/users/activity", icon: Clock01Icon },
        ],
      },
    ],
  },
  {
    id: "users",
    label: "Codeward Users",
    href: "/users",
    icon: UserGroupIcon,
    panelTitle: "Users & Access",
    panelSubtitle: "Manage users, orgs & activity",
    groups: [
      {
        id: "manage",
        label: "Manage",
        links: [
          { label: "Overview", href: "/users", end: true, icon: Analytics01Icon },
          { label: "All Users", href: "/users/all", icon: UserListIcon },
          { label: "Administrators", href: "/users/admins", icon: UserGroupIcon },
          { label: "Organizations", href: "/users/organizations", icon: Building01Icon },
          { label: "Activity Log", href: "/users/activity", icon: Clock01Icon },
          { label: "Beta Codes", href: "/users/beta-codes", icon: Ticket01Icon },
        ],
      },
      {
        id: "analytics",
        label: "Users Analytics",
        collapsible: true,
        defaultOpen: true,
        links: [
          { label: "Growth & retention", href: "/users", icon: ChartAverageIcon },
          { label: "Plan distribution", href: "/users", icon: StarAward01Icon },
          { label: "Trial redemptions", href: "/users/beta-codes", icon: Ticket01Icon },
        ],
      },
      {
        id: "folders",
        label: "Segments",
        collapsible: true,
        defaultOpen: false,
        links: [
          { label: "Admins & roles", href: "/users/admins", icon: UserGroupIcon },
          { label: "Organizations", href: "/users/organizations", icon: FolderManagementIcon },
        ],
      },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    href: "/revenue",
    icon: Dollar01Icon,
    panelTitle: "Revenue & Billing",
    panelSubtitle: "MRR, payers & subscriptions",
    groups: [
      {
        id: "manage",
        label: "Manage",
        links: [
          { label: "Overview", href: "/revenue", end: true, icon: Analytics01Icon },
          { label: "Paying Orgs", href: "/revenue/orgs", icon: Wallet01Icon },
          { label: "Subscribers", href: "/revenue/subscribers", icon: InboxIcon },
        ],
      },
      {
        id: "analytics",
        label: "Revenue Analytics",
        collapsible: true,
        defaultOpen: true,
        links: [
          { label: "MRR growth", href: "/revenue", icon: ChartAverageIcon },
          { label: "Top payers", href: "/revenue/subscribers", icon: StarAward01Icon },
        ],
      },
    ],
  },
  {
    id: "messages",
    label: "Messages",
    href: "/messages",
    icon: Mail01Icon,
    panelTitle: "Messages",
    panelSubtitle: "Emails sent & received via Resend",
    groups: [
      {
        id: "compose",
        label: "Actions",
        links: [
          { label: "Compose Email", href: "/messages/compose", icon: MailEdit02Icon },
        ],
      },
      {
        id: "inbox",
        label: "Inbox",
        links: [
          { label: "All Messages", href: "/messages", end: true, icon: InboxIcon },
          { label: "Transactional", href: "/messages?filter=transactional", icon: Alert01Icon },
          { label: "Personal / Direct", href: "/messages?filter=personal", icon: UserGroupIcon },
        ],
      },
      {
        id: "delivery",
        label: "Delivery",
        collapsible: true,
        defaultOpen: true,
        links: [
          { label: "Failed & Bounced", href: "/messages?status=failed", icon: SentIcon },
        ],
      },
    ],
  },
  {
    id: "alerts",
    label: "Alerts",
    href: "/alerts",
    icon: Alert01Icon,
    panelTitle: "Alerts",
    panelSubtitle: "Incidents & monitors",
    groups: [
      {
        id: "alerts-group",
        label: "Monitoring",
        links: [{ label: "All alerts", href: "/alerts", end: true, icon: Alert01Icon }],
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings01Icon,
    panelTitle: "Settings",
    panelSubtitle: "Workspace preferences",
    groups: [
      {
        id: "settings-group",
        label: "Workspace",
        links: [{ label: "General", href: "/settings", end: true, icon: Settings01Icon }],
      },
    ],
  },
];
