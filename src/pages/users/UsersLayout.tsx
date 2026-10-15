import { Outlet } from "react-router-dom";

// Secondary navigation is now handled globally by Layout.tsx (dual-panel).
// This wrapper only provides the content outlet for /users/* routes.
export default function UsersLayout() {
  return (
    <div className="h-full w-full">
      <Outlet />
    </div>
  );
}
