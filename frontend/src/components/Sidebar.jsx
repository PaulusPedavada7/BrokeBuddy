import React, { useState , useContext } from 'react';
import { UserContext } from '../App.jsx';
import ThemeToggle from './ThemeToggle';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const { currentUser } = useContext(UserContext);

    return (
        <div className={`h-screen flex flex-col justify-between bg-gray-100 dark:bg-[#151515] text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-600 transition-all duration-300 overflow-hidden ${isOpen ? "w-64" : "w-16"}`}>
            {/* Top navigation */}
            <div>
                {/* Title and menu icon */}
                <div className="flex items-center justify-between p-4">
                    {isOpen && <h2 className="text-xl font-bold">BrokeBuddy</h2>}
                    <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 dark:text-gray-400">{isOpen ? "<" : ">"}</button>
                </div>

                {/* Sidebar navigation links */}
                <nav className="flex flex-col gap-3 mt-4 p-4">
                    {/* CHANGE THE LINKS */}
                    {/* <Link to="/" className="flex items-center gap-3 hover:text-blue-500">{isOpen && <span>Dashboard</span>}</Link>
                    <Link to="/" className="flex items-center gap-3 hover:text-blue-500">{isOpen && <span>Profile</span>}</Link> */}
                    <a href="#" className="flex gap-3 hover:text-blue-500">{isOpen && <span>Dashboard</span>}</a>
                    <a href="#" className="flex gap-3 hover:text-blue-500">{isOpen && <span>Profile</span>}</a>
                </nav>
            </div>

            {/* Bottom navigation */}
            <div className="flex flex-col gap-4 mb-4 p-4">
                <ThemeToggle />

                {/* User Profile */}
                <div className="flex gap-2">
                    {/* Add Profile Icon */}
                    {isOpen && <span>{currentUser.first_name} {currentUser.last_name}</span>}
                </div>
            </div>
        </div>
    );
}