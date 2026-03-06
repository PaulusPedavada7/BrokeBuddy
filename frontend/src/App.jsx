import React, { useState, createContext, useEffect, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/dashboard/Dashboard";
import Signin from "./components/pages/Signin.jsx";
import Signup from "./components/pages/Signup.jsx";
import Transactions from "./components/pages/Transactions.jsx";
import Account from "./components/pages/Account.jsx";
import api from "./axios.jsx";

export const UserContext = createContext(null);

function ProtectedRoute({ children }) {
  const { currentUser } = useContext(UserContext);
  if (!currentUser) return <Navigate to="/signin" />;
  return children;
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/me")
      .then(res => setCurrentUser(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []);

  if (loading) return null;

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </UserContext.Provider>
  );
}

export default App;
