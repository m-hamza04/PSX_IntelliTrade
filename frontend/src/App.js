import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import Portfolio from './pages/Portfolio';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import Transactions from './pages/Transactions';
import Alerts from './pages/Alerts';
import Watchlist from './pages/Watchlist';
import MarketIndices from './pages/MarketIndices';
import News from './pages/News';

function hasValidSession() {
    return localStorage.getItem('isLoggedIn') === 'true'
    && Boolean(localStorage.getItem('user_id'));
}

function ProtectedRoute({ children }) {
    if (!hasValidSession()) {
        localStorage.clear();
        return <Navigate to="/" replace />;
    }
    return children;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                <Route path="/stocks" element={
                    <ProtectedRoute><Stocks /></ProtectedRoute>
                } />
                <Route path="/portfolio" element={
                    <ProtectedRoute><Portfolio /></ProtectedRoute>
                } />
                <Route path="/watchlist" element={
                    <ProtectedRoute><Watchlist /></ProtectedRoute>
                } />
                <Route path="/analytics" element={
                    <ProtectedRoute><Analytics /></ProtectedRoute>
                } />
                <Route path="/transactions" element={
                    <ProtectedRoute><Transactions /></ProtectedRoute>
                } />
                <Route path="/alerts" element={
                    <ProtectedRoute><Alerts /></ProtectedRoute>
                } />
                <Route path="/indices" element={
                    <ProtectedRoute><MarketIndices /></ProtectedRoute>
                } />
                <Route path="/news" element={
                    <ProtectedRoute><News /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                    <ProtectedRoute><Admin /></ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}

export default App;