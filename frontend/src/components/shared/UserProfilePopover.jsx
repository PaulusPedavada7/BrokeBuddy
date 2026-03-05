import { useState, useContext, useRef } from "react"
import { UserContext } from "../../App.jsx";
import ThemeToggle from "../shared/ThemeToggle.jsx";
import { ChevronRightIcon } from "@heroicons/react/24/solid";

export default function UserProfilePopover({isOpen: sidebarOpen}) {
  const { currentUser } = useContext(UserContext);
  const [open, setOpen] = useState(false);

  const initials = `${currentUser?.first_name?.[0] ?? ""}${currentUser?.last_name?.[0] ?? ""}`.toUpperCase();
  const fullName = `${currentUser?.first_name ?? ""} ${currentUser?.last_name ?? ""}`.trim();

  // Function to open the popover
  const handleOpen = () => {

  };

  return (
    <>
      {/* Popover trigger */}
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2.5 rounded-xl px-2 py-2 w-full text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${open ? "bg-black/5 dark:bg-white/5" : ""}`}
      >
        {/* Avatar circle */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white bg-blue-600 dark:bg-blue-500 select-none">
          {initials || "??"}
        </span>

        {/* Name + email - hidden when sidebar is collapsed */}
        {sidebarOpen && (
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
              {fullName || "Loading..."}
            </span>
            <span className="truncate text-xs text-gray-400 dark:text-gray-500">
              {currentUser?.email}
            </span>
          </span>
        )}

        {/* Chevron icon */}
        {sidebarOpen && (
          <span className={`shrink-0 text-gray-300 transition-transform duration-200 ${open ? "rotate-90" : "-rotate-90"}`}>
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {/* Popover */}
      
    </>
  )
}