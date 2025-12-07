import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../axios.jsx';

export default function Signin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();
        try {
            const res = await api.post("/signin", {
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
            <h2>Sign in</h2>
            <p>or <Link to="/signup">create an account</Link></p>
            <form onSubmit={handleSubmit}>
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
                <button type="submit" className="cursor-pointer">Sign in</button>
            </form>
        </div>
    );
}