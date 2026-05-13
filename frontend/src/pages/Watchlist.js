import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserWatchlist, removeFromWatchlist } from '../services/api';

function Watchlist() {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: 'success' });
    const navigate = useNavigate();
    const location = useLocation();

    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('user_id');

    const getNavBtnStyle = (path) => location.pathname === path
        ? { ...styles.navBtn, background: 'rgba(0,212,255,0.2)', border: '1px solid #00d4ff', color: '#00d4ff' }
        : styles.navBtn;

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
    };

    const fetchWatchlist = useCallback(async () => {
        try {
            const response = await getUserWatchlist(userId);
            setWatchlist(response.data.data || []);
        } catch (error) {
            console.error('Error loading watchlist:', error);
            setWatchlist([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            localStorage.clear();
            navigate('/');
            return;
        }
        fetchWatchlist();
    }, [fetchWatchlist, navigate, userId]);

    const handleRemove = async (item) => {
        try {
            const companyId = Number(item.COMPANY_ID ?? item.company_id);
            await removeFromWatchlist({
                user_id: Number(localStorage.getItem('user_id')),
                company_id: companyId
            });
            setMessage({ text: 'Removed from watchlist!', type: 'success' });
            fetchWatchlist();
        } catch (error) {
            setMessage({ text: 'Failed to remove', type: 'error' });
        }
    };

    if (loading) {
        return (
            <div style={styles.loading}>
                <h2 style={{ color: '#00d4ff' }}>Loading Watchlist...</h2>
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
                    {role === 'ADMIN' && <button onClick={() => navigate('/admin')} style={getNavBtnStyle('/admin')}>Admin Panel</button>}
                </div>
                <button onClick={() => { localStorage.clear(); navigate('/'); }} style={styles.logoutBtn}>Logout</button>
            </nav>

            <div style={styles.content}>
                <h2 style={styles.title}>My Watchlist</h2>

                {message.text && (
                    <div style={{
                        ...styles.message,
                        background: message.type === 'success' ? 'rgba(0,255,136,0.15)' : 'rgba(255,107,107,0.15)',
                        color: message.type === 'success' ? '#00ff88' : '#ff6b6b',
                        borderColor: message.type === 'success' ? 'rgba(0,255,136,0.45)' : 'rgba(255,107,107,0.45)'
                    }}>
                        {message.text}
                    </div>
                )}

                <div style={styles.tableCard}>
                    {watchlist.length === 0 ? (
                        <p style={styles.empty}>No stocks in watchlist</p>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Symbol</th>
                                    <th style={styles.th}>Company</th>
                                    <th style={styles.th}>Sector</th>
                                    <th style={styles.th}>Current Price</th>
                                    <th style={styles.th}>Change%</th>
                                    <th style={styles.th}>Added Date</th>
                                    <th style={styles.th}>Notes</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {watchlist.map((item) => (
                                    <tr key={item.WATCHLIST_ID}>
                                        <td style={styles.td}><span style={styles.symbol}>{item.SYMBOL}</span></td>
                                        <td style={styles.td}>{item.COMPANY_NAME}</td>
                                        <td style={styles.td}>{item.SECTOR}</td>
                                        <td style={styles.td}>Rs {Number(item.CURRENT_PRICE || 0).toFixed(2)}</td>
                                        <td style={{ ...styles.td, color: Number(item.PCT_CHANGE || 0) >= 0 ? '#00ff88' : '#ff6b6b' }}>
                                            {Number(item.PCT_CHANGE || 0).toFixed(2)}%
                                        </td>
                                        <td style={styles.td}>{new Date(item.ADDED_DATE).toLocaleDateString()}</td>
                                        <td style={styles.td}>{item.NOTES || '-'}</td>
                                        <td style={styles.td}>
                                            <button style={styles.removeBtn} onClick={() => handleRemove(item)}>
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
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
    title: { marginTop: 0 },
    message: { border: '1px solid', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', fontWeight: 'bold' },
    tableCard: { background: 'rgba(255,255,255,0.05)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { color: 'rgba(255,255,255,0.6)', padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' },
    td: { padding: '12px', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' },
    symbol: { background: 'rgba(0,212,255,0.2)', color: '#00d4ff', borderRadius: '6px', padding: '4px 8px', fontWeight: 'bold' },
    removeBtn: { background: '#ff6b6b', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' },
    empty: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '24px' }
};

export default Watchlist;
