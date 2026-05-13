import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllIndices, getIndexStocks } from '../services/api';

function MarketIndices() {
    const [indices, setIndices] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem('role');

    const getNavBtnStyle = (path) => location.pathname === path
        ? { ...styles.navBtn, background: 'rgba(0,212,255,0.2)', border: '1px solid #00d4ff', color: '#00d4ff' }
        : styles.navBtn;

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const res = await getAllIndices();
                const list = res.data.data || [];
                setIndices(list);
                if (list.length > 0) {
                    handleIndexClick(list[0]);
                }
            } catch (error) {
                console.error('Error loading indices:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchIndices();
    }, []);

    const handleIndexClick = async (idx) => {
        setSelectedIndex(idx);
        try {
            const res = await getIndexStocks(idx.INDEX_ID);
            setStocks(res.data.data || []);
        } catch (error) {
            console.error('Error loading index stocks:', error);
            setStocks([]);
        }
    };

    if (loading) {
        return <div style={styles.loading}><h2 style={{ color: '#00d4ff' }}>Loading Indices...</h2></div>;
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
                <h2 style={styles.title}>Market Indices</h2>

                <div style={styles.cards}>
                    {indices.map((idx) => (
                        <button
                            key={idx.INDEX_ID}
                            onClick={() => handleIndexClick(idx)}
                            style={{ ...styles.indexCard, background: selectedIndex?.INDEX_ID === idx.INDEX_ID ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.03)' }}
                        >
                            <h3 style={styles.indexName}>{idx.INDEX_NAME}</h3>
                            <p style={styles.indexDesc}>{idx.DESCRIPTION}</p>
                            <p style={styles.indexBase}>Base: {Number(idx.BASE_VALUE || 0).toFixed(2)}</p>
                        </button>
                    ))}
                </div>

                <div style={styles.tableCard}>
                    <h3 style={{ color: '#00d4ff' }}>{selectedIndex?.INDEX_NAME || 'Index'} Stocks</h3>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Symbol</th>
                                <th style={styles.th}>Company</th>
                                <th style={styles.th}>Sector</th>
                                <th style={styles.th}>Weightage%</th>
                                <th style={styles.th}>Current Price</th>
                                <th style={styles.th}>Change%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stocks.length === 0 ? (
                                <tr><td colSpan={6} style={styles.emptyCell}>No stocks found</td></tr>
                            ) : stocks.map((s) => (
                                <tr key={s.SYMBOL}>
                                    <td style={styles.td}><span style={styles.symbol}>{s.SYMBOL}</span></td>
                                    <td style={styles.td}>{s.COMPANY_NAME}</td>
                                    <td style={styles.td}>{s.SECTOR}</td>
                                    <td style={styles.td}>
                                        <div style={styles.progressWrap}>
                                            <div style={{ ...styles.progressBar, width: `${Math.max(0, Math.min(100, Number(s.WEIGHTAGE || 0)))}%` }} />
                                        </div>
                                        {Number(s.WEIGHTAGE || 0).toFixed(2)}%
                                    </td>
                                    <td style={styles.td}>Rs {Number(s.CURRENT_PRICE || 0).toFixed(2)}</td>
                                    <td style={{ ...styles.td, color: Number(s.PCT_CHANGE || 0) >= 0 ? '#00ff88' : '#ff6b6b' }}>{Number(s.PCT_CHANGE || 0).toFixed(2)}%</td>
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
    title: { marginTop: 0 },
    cards: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' },
    indexCard: { border: '1px solid #ffd700', borderRadius: '12px', padding: '14px', textAlign: 'left', color: 'white', cursor: 'pointer' },
    indexName: { margin: '0 0 6px 0', color: '#ffd700' },
    indexDesc: { margin: '0 0 8px 0', color: 'rgba(255,255,255,0.7)', fontSize: '13px' },
    indexBase: { margin: 0, color: '#00d4ff', fontWeight: 'bold' },
    tableCard: { background: 'rgba(255,255,255,0.05)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { color: 'rgba(255,255,255,0.6)', padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' },
    td: { padding: '12px', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' },
    symbol: { background: 'rgba(0,212,255,0.2)', color: '#00d4ff', borderRadius: '6px', padding: '4px 8px', fontWeight: 'bold' },
    progressWrap: { width: '100%', height: '8px', background: 'rgba(255,255,255,0.12)', borderRadius: '999px', marginBottom: '6px' },
    progressBar: { height: '100%', background: '#ffd700', borderRadius: '999px' },
    emptyCell: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '20px' }
};

export default MarketIndices;
