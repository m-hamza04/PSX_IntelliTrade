import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserTransactions } from '../services/api';

function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [filterType, setFilterType] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('user_id');

    const getNavBtnStyle = (path) => location.pathname === path
        ? { ...styles.navBtn, background: 'rgba(0,212,255,0.2)', border: '1px solid #00d4ff', color: '#00d4ff' }
        : styles.navBtn;

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await getUserTransactions(userId);
                setTransactions(response.data.data || []);
            } catch (error) {
                console.error('Error loading transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchTransactions();
        } else {
            localStorage.clear();
            navigate('/');
        }
    }, [navigate, userId]);

    const filteredTransactions = useMemo(() => {
        if (filterType === 'ALL') return transactions;
        return transactions.filter((tx) => tx.TRANS_TYPE === filterType);
    }, [filterType, transactions]);

    if (loading) {
        return (
            <div style={styles.loading}>
                <h2 style={{ color: '#00d4ff' }}>Loading Transactions...</h2>
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
                    <h2 style={styles.title}>Transaction History</h2>
                    <div style={styles.badge}>Total: {filteredTransactions.length}</div>
                </div>

                <div style={styles.filterRow}>
                    {['ALL', 'BUY', 'SELL'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            style={{
                                ...styles.filterBtn,
                                background: filterType === type ? 'rgba(0,212,255,0.2)' : 'transparent',
                                borderColor: filterType === type ? '#00d4ff' : 'rgba(255,255,255,0.2)'
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div style={styles.tableCard}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Symbol</th>
                                <th style={styles.th}>Company</th>
                                <th style={styles.th}>Type</th>
                                <th style={styles.th}>Quantity</th>
                                <th style={styles.th}>Price</th>
                                <th style={styles.th}>Total Amount</th>
                                <th style={styles.th}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td style={styles.emptyCell} colSpan={7}>No transactions found.</td>
                                </tr>
                            ) : filteredTransactions.map((tx) => (
                                <tr key={tx.TRANSACTION_ID}>
                                    <td style={styles.td}><span style={styles.symbol}>{tx.SYMBOL}</span></td>
                                    <td style={styles.td}>{tx.COMPANY_NAME}</td>
                                    <td style={styles.td}>
                                        <span
                                            style={{
                                                ...styles.typePill,
                                                color: tx.TRANS_TYPE === 'BUY' ? '#00ff88' : '#ff6b6b',
                                                borderColor: tx.TRANS_TYPE === 'BUY' ? 'rgba(0,255,136,0.4)' : 'rgba(255,107,107,0.4)'
                                            }}
                                        >
                                            {tx.TRANS_TYPE}
                                        </span>
                                    </td>
                                    <td style={styles.td}>{tx.QUANTITY}</td>
                                    <td style={styles.td}>Rs {Number(tx.PRICE).toFixed(2)}</td>
                                    <td style={styles.td}>Rs {Number(tx.TOTAL_AMOUNT).toFixed(2)}</td>
                                    <td style={styles.td}>{new Date(tx.TRANS_DATE).toLocaleString()}</td>
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
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    title: { margin: 0, color: '#fff' },
    badge: { background: 'rgba(0,212,255,0.2)', border: '1px solid rgba(0,212,255,0.4)', color: '#00d4ff', borderRadius: '999px', padding: '8px 14px', fontWeight: 'bold' },
    filterRow: { display: 'flex', gap: '10px', marginBottom: '16px' },
    filterBtn: { background: 'transparent', border: '1px solid', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
    tableCard: { background: 'rgba(255,255,255,0.05)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { color: 'rgba(255,255,255,0.6)', padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' },
    td: { padding: '12px', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' },
    symbol: { background: 'rgba(0,212,255,0.2)', color: '#00d4ff', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' },
    typePill: { border: '1px solid', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold' },
    emptyCell: { padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }
};

export default Transactions;
