import { Outlet } from "react-router-dom";

export default function MessagesLayout() {
  return (
    <div className="flex h-full w-full min-w-0 flex-1 overflow-hidden">
      <Outlet />
    </div>
  );
}
