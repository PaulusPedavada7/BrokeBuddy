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
        <div>
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                />
                <input 
                    type="text" 
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                />
                <input 
                    type="email" 
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input 
                    type="password" 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="cursor-pointer">Sign Up</button>
            </form>
            <p>Already have an account? <Link to="/signin">Sign in</Link></p>
        </div>
    );
}