import React, { useEffect, useState, useContext } from "react";
import api from "../axios.jsx";
import { UserContext } from "../App.jsx";

function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const { currentUser } = useContext(UserContext);

  return (
    <p>Hello, {currentUser.first_name} {currentUser.last_name}</p>
  );
}

export default Dashboard;