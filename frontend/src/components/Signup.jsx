import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../axios.jsx';

export default function Signup() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();
        try {
            const res = await api.post("/signup", {
                first_name: firstName,
                last_name: lastName,
                email: email,
                password: password
            });
            console.log(res.data.message);
            navigate("/dashboard");
        } catch (error) {
            console.error(error?.response?.data?.detail || error.message);
        }
    }

    return (
        <div className="min h-screen flex justify-center items-center bg-gray-100">
            <div className="bg-white p-12 rounded-lg shadow-lg w-full max-w-md">
                <div className="text-3xl font-bold test-gray-800 mb-12">Sign Up</div>
                <form onSubmit={handleSubmit} className="space-y-7">
                    <input 
                        type="text" 
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 bg-gray-50 text-gray-900 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input 
                        type="text" 
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 bg-gray-50 text-gray-900 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input 
                        type="email" 
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 bg-gray-50 text-gray-900 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input 
                        type="password" 
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 bg-gray-50 text-gray-900 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button type="submit" className="mt-4 cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition-colors duration-200">Sign Up</button>
                </form>
                <p className="text-gray-400 mt-2">Already have an account?{" "}
                    <Link to="/signin" className="text-blue-600 hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}