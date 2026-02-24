import React, { useState , useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserContext } from '../App.jsx';
import ThemeToggle from './ThemeToggle';
import { Bars3Icon, XMarkIcon, UserCircleIcon, UserIcon, HomeIcon, BanknotesIcon } from '@heroicons/react/24/solid';


export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const { currentUser } = useContext(UserContext);
    const location = useLocation();

    // Function to check if the current path matches the link's path
    const isActive = (path) => location.pathname === path;

    // NOTE: Used backtick for className not single quotes to allow JS template literal and string interpolation
    return (
        <div className={`h-screen flex flex-col justify-between bg-gray-100 dark:bg-[#151515] text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-600 transition-all duration-300 overflow-hidden ${isOpen ? "w-64" : "w-16"}`}>
            {/* Top navigation */}
            <div>
                {/* Title and menu icon */}
                <div className="flex items-center justify-between w-full p-4">
                    {isOpen && <h2 className="text-xl font-bold px-3">BrokeBuddy</h2>}
                    <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-400">
                        {isOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
                    </button>
                </div>

                {/* Sidebar navigation links */}
                <nav className={`flex flex-col gap-1 mt-4 ${isOpen ? "p-4": "px-2 py-4"}`}>
                    {/* CHANGE THE PLACEHOLDER LINKS (#) and use <Link to?> tag instead of <a> */}
                    {/* Make a list for the pages with name and links */}
                    <Link to="/dashboard" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isOpen && isActive("/dashboard") ? "text-blue-500 dark:text-white bg-black/5 dark:bg-white/5" : isOpen && "dark:text-gray-400 hover:text-blue-500 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"}`}>
                        <HomeIcon className="w-6 h-6 shrink-0" />
                        {isOpen && <span>Dashboard</span>}
                    </Link>

                    <Link to="/transactions" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isOpen && isActive("/transactions") ? "text-blue-500 dark:text-white bg-black/5 dark:bg-white/5" : isOpen && "dark:text-gray-400 hover:text-blue-500 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"}`}>
                        <BanknotesIcon className="w-6 h-6 shrink-0" />
                        {isOpen && <span>Transactions</span>}
                    </Link>
                    
                    <a href="#" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isOpen && isActive("/profile") ? "text-blue-500 dark:text-white bg-black/5 dark:bg-white/5" : isOpen && "dark:text-gray-400 hover:text-blue-500 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"}`}>
                        <UserIcon className="w-6 h-6 shrink-0" />
                        {isOpen && <span>Profile</span>}
                    </a>
                </nav>
            </div>

            {/* Bottom navigation */}
            <div className="flex flex-col gap-6 mb-4 p-4">
                {isOpen && <ThemeToggle />}

                {/* User Profile */}
                <div className="flex items-center gap-2">
                    <UserCircleIcon className="w-8 h-8"/>
                    {isOpen && <span>{currentUser.first_name} {currentUser.last_name}</span>}
                </div>
            </div>
        </div>
    );
}