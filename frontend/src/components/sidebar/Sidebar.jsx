import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserContext } from "../../App.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import UserProfilePopover from "./UserProfilePopover.jsx";
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  HomeIcon,
  BanknotesIcon,
} from "@heroicons/react/24/solid";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const { currentUser } = useContext(UserContext);
  const location = useLocation();

  // Function to check if the current path matches the link's path
  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
  `flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
    isActive(path)
      ? `text-blue-500 dark:text-blue-400 ${isOpen ? "bg-black/5 dark:bg-white/5" : ""}`
      : !isOpen
        ? ""
        : "text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
  } ${!isOpen ? "justify-center" : ""}`;

  // NOTE: Used backtick for className not single quotes to allow JS template literal and string interpolation
  return (
    <div
      className={`h-screen shrink-0 flex flex-col justify-between bg-gray-100 dark:bg-[#151515] text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-600 transition-all duration-300 overflow-visible ${isOpen ? "w-64" : "w-16"}`}
    >
      {/* Top navigation */}
      <div className="flex flex-col flex-1">
        {/* Title and menu icon */}
        <div className="flex items-center justify-between w-full p-4">
          {isOpen && <h2 className="text-xl font-bold px-3">BrokeBuddy</h2>}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-400"
          >
            {isOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Sidebar navigation links */}
        <nav
          className={`flex flex-col gap-1 mt-4 ${isOpen ? "p-4" : "px-2 py-4"}`}
        >
          {/* Make a list for the pages with name and links */}
          <Link to="/dashboard" className={navLinkClass("/dashboard")}>
            <HomeIcon className="w-6 h-6 shrink-0" />
            {isOpen && <span>Dashboard</span>}
          </Link>

          <Link to="/transactions" className={navLinkClass("/transactions")}>
            <BanknotesIcon className="w-6 h-6 shrink-0" />
            {isOpen && <span>Transactions</span>}
          </Link>

          <Link to="/account" className={navLinkClass("/account")}>
            <UserIcon className="w-6 h-6 shrink-0" />
            {isOpen && <span>Account</span>}
          </Link>
        </nav>
      </div>

      {/* Bottom navigation */}
      <div className={`flex flex-col gap-6 mb-4 ${isOpen ? "px-4" : ""} py-4`}>
        <UserProfilePopover isOpen={isOpen} />
      </div>
    </div>
  );
}
