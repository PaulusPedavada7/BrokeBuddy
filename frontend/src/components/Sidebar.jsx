import React, { useState } from 'react';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className={`h-screen bg-gray-100 dark:bg-[#151515] text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-600 transition-all duration-300 overflow-hidden ${isOpen ? "w-64" : "w-16"}`}>
            {/* Sidebar title and menu icon */}
            <div className="flex items-center justify-between p-4">
                {isOpen && <h2 className="text-xl font-bold">Menu</h2>}
                <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 dark:text-gray-400">{isOpen ? "<" : ">"}</button>
            </div>
        </div>
    );
}