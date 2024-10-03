import React, { useState } from 'react';
import AxiosInstance from './AxiosInstance';
import { useNavigate } from 'react-router-dom';
import '../css/login.css';

const Login = ({ setIsAuthenticated }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();  // Prevent the form from submitting the traditional way (which would cause a refresh)

        try {
            // Make a POST request to the Flask backend
            const response = await AxiosInstance.post('/api/login/', {
                username,
                password
            });

            // If login is successful
            if (response.status === 200) {
                setMessage('Login successful!');
                setIsAuthenticated(true);  // Set the authentication state to true
                navigate('/dashboard');    // Redirect to dashboard
            } else {
                setMessage('Login failed. Please check your credentials.');
                setIsAuthenticated(false);  // Ensure the authentication state is false on failure
            }
        } catch (error) {
            // If login fails, display an error message
            setMessage('Login failed. Please check your credentials.');
            setIsAuthenticated(false);  // Ensure the authentication state is false on failure
        }
    };

    return (
        <div className='div1'>
        <div className='login-form'>
            <div className='login-head'>
                <h2>Sign In</h2>
                <img src="../logo512.png" alt="logo" />
            </div>
            <form onSubmit={handleLogin}>
                <div className='cred1'>
                    <label>Email / Mobile</label>
                    <input 
                        type="text" 
                        value={username} 
                        placeholder="Email / Mobile"
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                    />
                </div>
                <div className='cred2'>
                    <label>Password</label>
                    <input 
                        type="password" 
                        value={password} 
                        placeholder="Password" 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                <button className='submit' type="submit">Login</button>
            </form>

            {/* Display the message if it exists */}
            {message && <p>{message}</p>}
        </div>
        </div>
    );
};

export default Login;
