import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const API = axios.create({
    baseURL: 'http://localhost:5000/api'
});

function Admin() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem('role');

    const getNavBtnStyle = (path) => location.pathname === path
        ? { ...styles.navBtn, background: 'rgba(0,212,255,0.2)', border: '1px solid #00d4ff', color: '#00d4ff' }
        : styles.navBtn;

    useEffect(() => {
        if (role !== 'ADMIN') {
            navigate('/dashboard');
            return;
        }
        fetchAdminData();
    }, [navigate, role]);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const [statsRes, usersRes, transactionsRes] = await Promise.all([
                API.get('/admin/stats'),
                API.get('/admin/users'),
                API.get('/admin/transactions')
            ]);

            setStats(statsRes.data.data);
            setUsers(usersRes.data.data || []);
            setTransactions(transactionsRes.data.data || []);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to load admin panel data');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const handleMakeAdmin = async (userId) => {
        try {
            await API.put(`/admin/users/${userId}/role`);
            setMessage('User promoted to ADMIN');
            setMessageType('success');
            fetchAdminData();
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to update role');
            setMessageType('error');
        }
    };

    const handleDeactivate = async (userId) => {
        try {
            await API.put(`/admin/users/${userId}/deactivate`);
            setMessage('User deactivated successfully');
            setMessageType('success');
            fetchAdminData();
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to deactivate user');
            setMessageType('error');
        }
    };

    const handleActivate = async (userId) => {
        try {
            await API.put(`/admin/users/${userId}/activate`);
            setMessage('User activated successfully');
            setMessageType('success');
            fetchAdminData();
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to activate user');
            setMessageType('error');
        }
    };

    const handleGenerateAlerts = async () => {
        try {
            const response = await API.post('/admin/generate-alerts');
            setMessage(response.data.message || 'Alerts generated successfully!');
            setMessageType('success');
            fetchAdminData();
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to generate alerts');
            setMessageType('error');
        }
    };

    if (loading) {
        return (
            <div style={styles.loading}>
                <h2 style={{ color: '#00d4ff' }}>Loading Admin Panel...</h2>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <h1 style={styles.logo}>PSX IntelliTrade AI</h1>
                <div style={styles.navLinks}>
                    <button onClick={() => navigate('/dashboard')} style={getNavBtnStyle('/dashboard')}>Dashboard</button>
                    <button onClick={() => navigate('/stocks')} style={getNavBtnStyle('/stocks')}>Stocks</button>
                    <button onClick={() => navigate('/portfolio')} style={getNavBtnStyle('/portfolio')}>Portfolio</button>
                    <button onClick={() => navigate('/watchlist')} style={getNavBtnStyle('/watchlist')}>Watchlist</button>
                    <button onClick={() => navigate('/transactions')} style={getNavBtnStyle('/transactions')}>Transactions</button>
                    <button onClick={() => navigate('/alerts')} style={getNavBtnStyle('/alerts')}>Alerts</button>
                    <button onClick={() => navigate('/indices')} style={getNavBtnStyle('/indices')}>Indices</button>
                    <button onClick={() => navigate('/news')} style={getNavBtnStyle('/news')}>News</button>
                    <button onClick={() => navigate('/analytics')} style={getNavBtnStyle('/analytics')}>Analytics</button>
                    <button onClick={() => navigate('/admin')} style={{ ...styles.navBtn, background: 'rgba(255,215,0,0.2)', borderColor: '#ffd700', color: '#ffd700' }}>
                        Admin Panel
                    </button>
                </div>
                <button onClick={() => { localStorage.clear(); navigate('/'); }} style={styles.logoutBtn}>Logout</button>
            </nav>

            <div style={styles.content}>
                <h2 style={styles.title}>Admin Control Panel <span style={styles.adminBadge}>ADMIN</span></h2>

                {message && (
                    <div style={{
                        ...styles.message,
                        color: messageType === 'success' ? '#00ff88' : '#ff6b6b',
                        background: messageType === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(255,107,107,0.1)'
                    }}>
                        {message}
                    </div>
                )}

                <div style={styles.statsGrid}>
                    <div style={styles.card}>
                        <p style={styles.cardLabel}>Total Users</p>
                        <h3 style={styles.cardValue}>{stats?.total_users || 0}</h3>
                    </div>
                    <div style={styles.card}>
                        <p style={styles.cardLabel}>Total Portfolios</p>
                        <h3 style={styles.cardValue}>{stats?.total_portfolios || 0}</h3>
                    </div>
                    <div style={styles.card}>
                        <p style={styles.cardLabel}>Total Transactions</p>
                        <h3 style={styles.cardValue}>{stats?.total_transactions || 0}</h3>
                    </div>
                    <div style={styles.card}>
                        <p style={styles.cardLabel}>Total Alerts</p>
                        <h3 style={styles.cardValue}>{stats?.total_alerts || 0}</h3>
                    </div>
                </div>

                <div style={styles.sectionCard}>
                    <h3 style={styles.sectionTitle}>All Users</h3>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>User ID</th>
                                <th style={styles.th}>Username</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Role</th>
                                <th style={styles.th}>Created At</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.USER_ID}>
                                    <td style={styles.td}>{user.USER_ID}</td>
                                    <td style={styles.td}>{user.USERNAME}</td>
                                    <td style={styles.td}>{user.EMAIL}</td>
                                    <td style={styles.td}>{user.ROLE}</td>
                                    <td style={styles.td}>{new Date(user.CREATED_AT).toLocaleString()}</td>
                                    <td style={styles.td}>
                                        {user.ROLE === 'INVESTOR' && (
                                            <button onClick={() => handleMakeAdmin(user.USER_ID)} style={styles.makeAdminBtn}>Make Admin</button>
                                        )}
                                        {user.ROLE !== 'ADMIN' && Number(user.IS_ACTIVE) === 0 && (
                                            <button onClick={() => handleActivate(user.USER_ID)} style={styles.activateBtn}>Activate</button>
                                        )}
                                        {user.ROLE !== 'ADMIN' && Number(user.IS_ACTIVE) === 1 && (
                                            <button onClick={() => handleDeactivate(user.USER_ID)} style={styles.deactivateBtn}>Deactivate</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={styles.sectionCard}>
                    <button onClick={handleGenerateAlerts} style={styles.alertBtn}>Generate Market Alerts</button>
                </div>

                <div style={styles.sectionCard}>
                    <h3 style={styles.sectionTitle}>All Transactions</h3>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Username</th>
                                <th style={styles.th}>Symbol</th>
                                <th style={styles.th}>Type</th>
                                <th style={styles.th}>Quantity</th>
                                <th style={styles.th}>Price</th>
                                <th style={styles.th}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((t, index) => (
                                <tr key={`${t.USERNAME}-${index}`}>
                                    <td style={styles.td}>{t.USERNAME}</td>
                                    <td style={styles.td}>{t.SYMBOL}</td>
                                    <td style={{ ...styles.td, color: t.TRANS_TYPE === 'BUY' ? '#00ff88' : '#ff6b6b' }}>{t.TRANS_TYPE}</td>
                                    <td style={styles.td}>{t.QUANTITY}</td>
                                    <td style={styles.td}>Rs{t.PRICE}</td>
                                    <td style={styles.td}>{new Date(t.TRANS_DATE).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: '100vh', background: '#0a0a1a', color: 'white' },
    loading: { minHeight: '100vh', background: '#0a0a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    navbar: { background: 'rgba(255,255,255,0.05)', padding: '15px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' },
    logo: { color: '#00d4ff', margin: 0, fontSize: '20px' },
    navLinks: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    navBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
    logoutBtn: { background: '#ff6b6b', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
    content: { padding: '30px' },
    title: { color: 'white', marginBottom: '20px' },
    adminBadge: { color: '#ffd700', fontSize: '14px', marginLeft: '8px' },
    message: { padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontWeight: 'bold' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' },
    card: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '15px', padding: '20px', textAlign: 'center' },
    cardLabel: { color: 'rgba(255,255,255,0.65)', margin: 0 },
    cardValue: { color: '#00d4ff', fontSize: '28px', margin: '8px 0 0 0' },
    sectionCard: { background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px', overflowX: 'auto' },
    sectionTitle: { color: '#00d4ff', marginTop: 0, marginBottom: '12px' },
    alertBtn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #00d4ff, #0099ff)', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { color: 'rgba(255,255,255,0.65)', padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' },
    td: { color: 'white', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' },
    makeAdminBtn: { marginRight: '8px', background: '#00ff88', border: 'none', color: '#000', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    activateBtn: { background: '#00ff88', border: 'none', color: '#000', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    deactivateBtn: { background: '#ff6b6b', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Admin;