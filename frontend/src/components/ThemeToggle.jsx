import React, { useEffect, useState } from "react";
import { applyTheme } from "../theme";

export default function ThemeToggle() {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        if (saved) {
            setDarkMode(saved === "dark");
            applyTheme(saved);
        } else {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            setDarkMode(prefersDark);
            applyTheme(prefersDark ? "dark" : "light");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = darkMode ? "light" : "dark";
        setDarkMode(!darkMode);
        applyTheme(newTheme);
    };

    // Render the toggle switch
    return (
        <div onClick={toggleTheme} className="flex cursor-pointer">
            <div className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ${darkMode ? "bg-blue-600" : "bg-gray-300"}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${darkMode ? "translate-x-6" : "translate-x-0"}`}></div>
            </div>
            <span className="ml-3 text-gray-800 dark:text-gray-100">
                {darkMode ? "Dark" : "Light"}
            </span>
        </div>
    );
}