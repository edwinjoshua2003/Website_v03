import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProjectDetail from './components/ProjectDetail';
import Dailies from './components/Dailies';
import Log from './components/Log';
import AxiosInstance from './components/AxiosInstance';  // Use the custom Axios instance

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);  // To show a loading state while checking the session

  // Function to check the session
  const checkSession = async () => {
    try {
      const response = await AxiosInstance.get('/api/session/');
      if (response.status === 200) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('Session expired or not found...');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);  // Finish loading after session check
    }
  };

  useEffect(() => {
    // Check session on initial load (on any route)
    checkSession();
  }, []);

  if (loading) {
    return <div>Loading...</div>;  // Or a spinner to indicate session checking
  }

  // A component for private routes that checks authentication
  const PrivateRoute = ({ element }) => {
    return isAuthenticated ? element : <Navigate to="/login" />;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
      <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
      <Route path="/project/:id" element={<PrivateRoute element={<ProjectDetail />} />} />
      <Route path="/project" element={<PrivateRoute element={<Dashboard />} />} />
      <Route path="/log" element={<PrivateRoute element={<Log />} />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
    </Routes>
  );
};

export default App;
