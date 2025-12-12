import React, { useEffect, useState, useContext } from "react";
import api from "../axios.jsx";
import { UserContext } from "../App.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import Sidebar from "./Sidebar.jsx";

function Dashboard() {
  const { currentUser } = useContext(UserContext);

  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-900">
      <Sidebar />
      <div className="flex p-4">
        <p className="text-xl dark:text-gray-100">Hello, {currentUser.first_name} {currentUser.last_name}</p>
      </div>
    </div>
  );
}

export default Dashboard;