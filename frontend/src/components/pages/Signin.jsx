import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../axios.jsx";
import { UserContext } from "../../App.jsx";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setCurrentUser } = useContext(UserContext);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      // Send sign-in request to backend
      await api.post("/signin", {
        email: email,
        password: password,
      });

      // Fetch user info after successful sign-in
      const res = await api.get("/me");
      setCurrentUser(res.data);

      navigate("/dashboard");
    } catch (error) {
      console.error(error?.response?.data?.detail || error.message);
    }
  }

  return (
    <div className="min h-screen flex justify-center items-center bg-gray-100 dark:bg-zinc-900">
      <div className="bg-white dark:bg-zinc-800 p-12 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Sign in
        </div>
        <p className="text-zinc-400 mb-12">
          or{" "}
          <Link
            to="/signup"
            className="text-blue-600 dark:text-blue-500 hover:underline"
          >
            create an account
          </Link>
        </p>
        <form onSubmit={handleSubmit} className="space-y-7">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="mt-4 cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition-colors duration-200"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
