import React, { useEffect, useState, useContext } from "react";
import api from "../axios.jsx";
import { UserContext } from "../App.jsx";

function Dashboard() {
  const { currentUser } = useContext(UserContext);

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      <p className="dark:text-gray-100">Hello, {currentUser.first_name} {currentUser.last_name}</p>
    </div>
  );
}

export default Dashboard;