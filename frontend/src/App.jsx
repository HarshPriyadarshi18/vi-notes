import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Editor from './pages/Editor.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { authService } from './services/authService.js';
import './App.css';

export const App = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={authService.isAuthenticated() ? <Navigate to="/editor" /> : <Login />}
        />
        <Route
          path="/register"
          element={authService.isAuthenticated() ? <Navigate to="/editor" /> : <Register />}
        />
        <Route
          path="/editor"
          element={<ProtectedRoute component={Editor} />}
        />
        <Route path="/" element={<Navigate to="/editor" />} />
      </Routes>
    </Router>
  );
};

export default App;
