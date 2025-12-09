import React, { useEffect, useState } from "react";
import api from "../axios.jsx";

function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);

  // Just to test if user info is accessible
  const [user, setUser] = useState("");
  useEffect(() => {
    const getUser = async () => {
      try {
        // Try getting user info from backend
        const res = await api.get("/me");
        setUser(res.data);
        console.log("User info:", res.data);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
    getUser();
  }, []);

  return (
    <p>Hello, {user.first_name} {user.last_name}</p>
  );
}

export default Dashboard;