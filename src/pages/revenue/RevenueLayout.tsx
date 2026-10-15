import { Outlet } from "react-router-dom";

// Secondary navigation is handled globally by Layout.tsx (dual-panel).
export default function RevenueLayout() {
  return (
    <div className="h-full w-full">
      <Outlet />
    </div>
  );
}
