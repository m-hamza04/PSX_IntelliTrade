import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAlerts, markAlertRead } from '../services/api';

function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem('role');

    const getNavBtnStyle = (path) => location.pathname === path
        ? { ...styles.navBtn, background: 'rgba(0,212,255,0.2)', border: '1px solid #00d4ff', color: '#00d4ff' }
        : styles.navBtn;

    const fetchAlerts = async () => {
        try {
            const response = await getAlerts();
            setAlerts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const filteredAlerts = useMemo(() => {
        if (filter === 'ALL') return alerts;
        return alerts.filter((alert) => alert.ALERT_TYPE === filter);
    }, [alerts, filter]);

    const unreadCount = alerts.filter((a) => Number(a.IS_READ || 0) === 0).length;

    const handleMarkRead = async (alertId) => {
        try {
            await markAlertRead(alertId);
            setAlerts((prev) => prev.map((a) => (
                a.ALERT_ID === alertId ? { ...a, IS_READ: 1 } : a
            )));
        } catch (error) {
            console.error('Error marking alert read:', error);
        }
    };

    if (loading) {
        return (
            <div style={styles.loading}>
                <h2 style={{ color: '#00d4ff' }}>Loading Alerts...</h2>
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
                    {role === 'ADMIN' && (
                        <button onClick={() => navigate('/admin')} style={getNavBtnStyle('/admin')}>Admin Panel</button>
                    )}
                </div>
                <button onClick={() => { localStorage.clear(); navigate('/'); }} style={styles.logoutBtn}>Logout</button>
            </nav>

            <div style={styles.content}>
                <div style={styles.headerRow}>
                    <h2 style={styles.title}>Market Alerts</h2>
                    <div style={styles.badge}>Unread: {unreadCount}</div>
                </div>

                <div style={styles.filterRow}>
                    {['ALL', 'PRICE SPIKE', 'PRICE DROP'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            style={{
                                ...styles.filterBtn,
                                background: filter === type ? 'rgba(0,212,255,0.2)' : 'transparent',
                                borderColor: filter === type ? '#00d4ff' : 'rgba(255,255,255,0.2)'
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div style={styles.alertList}>
                    {filteredAlerts.length === 0 ? (
                        <p style={styles.empty}>No alerts found.</p>
                    ) : filteredAlerts.map((alert) => {
                        const isUnread = Number(alert.IS_READ || 0) === 0;
                        const isSpike = alert.ALERT_TYPE === 'PRICE SPIKE';

                        return (
                            <div
                                key={alert.ALERT_ID}
                                style={{
                                    ...styles.alertCard,
                                    borderLeftColor: isSpike ? '#00ff88' : '#ff6b6b',
                                    background: isUnread ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.04)'
                                }}
                            >
                                <div style={styles.alertTop}>
                                    <div style={styles.symbolWrap}>
                                        <span style={styles.symbol}>{alert.SYMBOL}</span>
                                        <span style={styles.company}>{alert.COMPANY_NAME}</span>
                                    </div>
                                    <span style={{ ...styles.typePill, color: isSpike ? '#00ff88' : '#ff6b6b' }}>{alert.ALERT_TYPE}</span>
                                </div>

                                <p style={styles.message}>{alert.MESSAGE}</p>

                                <div style={styles.alertBottom}>
                                    <span style={styles.date}>{new Date(alert.CREATED_AT).toLocaleString()}</span>
                                    {isUnread ? (
                                        <button onClick={() => handleMarkRead(alert.ALERT_ID)} style={styles.readBtn}>Mark as read</button>
                                    ) : (
                                        <span style={styles.readLabel}>Read</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    title: { margin: 0 },
    badge: { background: 'rgba(255,107,107,0.2)', border: '1px solid rgba(255,107,107,0.5)', color: '#ff6b6b', borderRadius: '999px', padding: '8px 14px', fontWeight: 'bold' },
    filterRow: { display: 'flex', gap: '10px', marginBottom: '16px' },
    filterBtn: { background: 'transparent', border: '1px solid', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
    alertList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    alertCard: { border: '1px solid rgba(255,255,255,0.08)', borderLeft: '4px solid', borderRadius: '12px', padding: '14px' },
    alertTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    symbolWrap: { display: 'flex', alignItems: 'center', gap: '10px' },
    symbol: { background: 'rgba(0,212,255,0.2)', color: '#00d4ff', borderRadius: '6px', padding: '4px 8px', fontWeight: 'bold' },
    company: { color: 'rgba(255,255,255,0.75)' },
    typePill: { border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold' },
    message: { margin: '0 0 10px 0', color: '#fff' },
    alertBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    date: { color: 'rgba(255,255,255,0.55)', fontSize: '12px' },
    readBtn: { background: 'transparent', border: '1px solid #00d4ff', color: '#00d4ff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' },
    readLabel: { color: '#00ff88', fontWeight: 'bold', fontSize: '12px' },
    empty: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '20px' }
};

export default Alerts;
