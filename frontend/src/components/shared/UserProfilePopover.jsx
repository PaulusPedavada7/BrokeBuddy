import { useState, useContext } from "react"
import { UserContext } from "../../App.jsx";
import ThemeToggle from "../shared/ThemeToggle.jsx";
import {
  ChevronRightIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  ExclamationTriangleIcon,
 } from "@heroicons/react/24/solid";

export default function UserProfilePopover({isOpen: sidebarOpen}) {
  const { currentUser } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const initials = `${currentUser?.first_name?.[0] ?? ""}${currentUser?.last_name?.[0] ?? ""}`.toUpperCase();
  const fullName = `${currentUser?.first_name ?? ""} ${currentUser?.last_name ?? ""}`.trim();

  const handleSignOut = () => {

    setShowSignOutModal(false);
  };

  return (
    <div className="relative">
      {/* Popover trigger */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-2.5 rounded-xl p-2 w-full text-left transition-colors cursor-pointer ${!sidebarOpen ? "justify-center" : `hover:bg-black/5 dark:hover:bg-white/5 ${open ? "bg-black/5 dark:bg-white/5" : ""}`}`}
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
      {open && (
        <div className="absolute m-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e1e1e] shadow-xl shadow-black/10 bottom-[calc(100%+8px)] left-0 w-full min-w-60">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3.5">
            {/* Avatar circle */}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white bg-blue-600 dark:bg-blue-500 select-none">
              {initials || "??"}
            </span>

            {/* Name + email */}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                {fullName || "Loading..."}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-gray-400 dark:text-gray-500">
                <EnvelopeIcon className="w-3 h-3 shrink-0" />
                {currentUser?.email}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-3 h-px bg-gray-300 dark:bg-gray-700" />

          {/* Account settings */}
          <div className="p-1.5">
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer">
              <Cog6ToothIcon className="w-4 h-4 shrink-0 text-gray-400" />
              Account settings
              <ChevronRightIcon className="ml-auto w-3.5 h-3.5 text-gray-300" />
            </button>
          </div>

          {/* Theme toggle */}
          <div className="px-1.5 pb-1.5">
            <span className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2">
              {/* USE CONTEXT FOR THEME AND REMOVE THE TEXT AND STYLING FROM THE COMPONENT TO MAKE THE TOGGLE MORE REUSABLE */}
              <ThemeToggle />
            </span>
          </div>

          {/* Divider */}
          <div className="mx-3 h-px bg-gray-300 dark:bg-gray-700" />

          {/* Sign out */}
          <div className="p-1.5">
            <button
              onClick={() => {
                setOpen(false);
                setShowSignOutModal(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 transition-colors cursor-pointer"
            >
              <ArrowRightStartOnRectangleIcon className="w-4 h-4 shrink-0 text-red-400" />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Sign out modal */}
      {showSignOutModal && (
        <div
          onClick={() => setShowSignOutModal(false)}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 w-full max-w-md"
          >
            {/* Header */}
            <ExclamationTriangleIcon className="w-6 h-6 mb-3 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Signing Out</h2>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to sign out?
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSignOutModal(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="rounded-xl px-4 py-2.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}