import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllStocks, getStockHistory, getStockDetail, addToWatchlist, getNewsByCompany } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const SECTORS = ['ALL', 'Banking', 'Energy', 'Fertilizer', 'Cement', 'Power', 'Technology', 'FMCG'];
const PERIODS = [7, 30, 90, 365];
const COMPARE_COLORS = ['#00d4ff', '#00ff88', '#ffd700'];

function Stocks() {
    const [stocks, setStocks] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [selectedStockDetail, setSelectedStockDetail] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sectorFilter, setSectorFilter] = useState('ALL');
    const [selectedDays, setSelectedDays] = useState(30);
    const [compareSymbols, setCompareSymbols] = useState([]);
    const [compareData, setCompareData] = useState([]);
    const [compareLoading, setCompareLoading] = useState(false);
    const [relatedNews, setRelatedNews] = useState([]);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [showWatchModal, setShowWatchModal] = useState(false);
    const [watchNote, setWatchNote] = useState('');
    const [pendingStock, setPendingStock] = useState(null);
    const [addingWatch, setAddingWatch] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('user_id');

    const getNavBtnStyle = (path) => location.pathname === path
        ? { ...styles.navBtn, background: 'rgba(0,212,255,0.2)', border: '1px solid #00d4ff', color: '#00d4ff' }
        : styles.navBtn;

    useEffect(() => {
        fetchStocks();
    }, []);

    const fetchStocks = async () => {
        try {
            const response = await getAllStocks();
            setStocks(response.data.data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStockChart = async (symbol, days) => {
        const response = await getStockHistory(symbol, days);
        return (response.data.data || []).map((item) => ({
            date: new Date(item.PRICE_DATE).toLocaleDateString(),
            price: Number(item.CLOSE_PRICE)
        }));
    };

    const handleStockClick = async (stock) => {
        setSelectedStock(stock);
        try {
            const [historyData, detailResponse] = await Promise.all([
                fetchStockChart(stock.SYMBOL, selectedDays),
                getStockDetail(stock.SYMBOL)
            ]);
            setHistory(historyData);
            setSelectedStockDetail(detailResponse.data.data || null);
            const newsRes = await getNewsByCompany(stock.COMPANY_ID);
            setRelatedNews((newsRes.data.data || []).slice(0, 3));
        } catch (error) {
            console.error('Error:', error);
            setRelatedNews([]);
        }
    };

    const showMessage = (text, type = 'success') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => setMessage(''), 3000);
    };

    const openWatchlistModal = (stock) => {
        setPendingStock(stock);
        setWatchNote('');
        setShowWatchModal(true);
    };

    const closeWatchlistModal = () => {
        setShowWatchModal(false);
        setPendingStock(null);
        setWatchNote('');
    };

    const handleAddToWatchlist = async () => {
        if (!pendingStock) return;
        try {
            if (!userId) {
                showMessage('Session expired, please login again.', 'error');
                return;
            }

            setAddingWatch(true);

            await addToWatchlist({
                user_id: Number(localStorage.getItem('user_id')),
                company_id: Number(pendingStock.COMPANY_ID),
                notes: watchNote.trim()
            });
            showMessage('Added to watchlist!', 'success');
            closeWatchlistModal();
        } catch (error) {
            showMessage('Already in watchlist!', 'error');
        } finally {
            setAddingWatch(false);
        }
    };

    const handlePeriodChange = async (days) => {
        setSelectedDays(days);
        if (!selectedStock) return;

        try {
            const historyData = await fetchStockChart(selectedStock.SYMBOL, days);
            setHistory(historyData);
        } catch (error) {
            console.error('Error updating period:', error);
        }
    };

    const toggleCompareSymbol = (symbol) => {
        setCompareSymbols((prev) => {
            if (prev.includes(symbol)) {
                return prev.filter((item) => item !== symbol);
            }
            if (prev.length >= 3) {
                return prev;
            }
            return [...prev, symbol];
        });
    };

    const loadComparison = async () => {
        if (compareSymbols.length < 2) return;

        try {
            setCompareLoading(true);
            const histories = await Promise.all(compareSymbols.map((symbol) => getStockHistory(symbol, selectedDays)));

            const mapByDate = new Map();
            histories.forEach((res, index) => {
                const symbol = compareSymbols[index];
                (res.data.data || []).forEach((row) => {
                    const date = new Date(row.PRICE_DATE).toLocaleDateString();
                    if (!mapByDate.has(date)) {
                        mapByDate.set(date, { date });
                    }
                    mapByDate.get(date)[symbol] = Number(row.CLOSE_PRICE);
                });
            });

            const merged = Array.from(mapByDate.values());
            setCompareData(merged);
        } catch (error) {
            console.error('Error loading comparison:', error);
        } finally {
            setCompareLoading(false);
        }
    };

    const filteredStocks = useMemo(() => {
        return stocks.filter((stock) => {
            const matchesSearch =
                stock.SYMBOL.toLowerCase().includes(search.toLowerCase()) ||
                stock.COMPANY_NAME.toLowerCase().includes(search.toLowerCase()) ||
                stock.SECTOR.toLowerCase().includes(search.toLowerCase());
            const matchesSector = sectorFilter === 'ALL' || stock.SECTOR.toLowerCase() === sectorFilter.toLowerCase();
            return matchesSearch && matchesSector;
        });
    }, [search, sectorFilter, stocks]);

    const riskColor = (riskLevel) => {
        if (riskLevel === 'HIGH RISK') return '#ff6b6b';
        if (riskLevel === 'MEDIUM RISK') return '#ffd700';
        return '#00ff88';
    };

    if (loading) {
        return (
            <div style={styles.loading}>
                <h2 style={{ color: '#00d4ff' }}>Loading Stocks...</h2>
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
                <h2 style={styles.title}>PSX Listed Stocks</h2>

                {message && (
                    <div
                        style={{
                            ...styles.message,
                            background: messageType === 'error' ? 'rgba(255,107,107,0.15)' : 'rgba(0,255,136,0.15)',
                            color: messageType === 'error' ? '#ff6b6b' : '#00ff88',
                            borderColor: messageType === 'error' ? 'rgba(255,107,107,0.45)' : 'rgba(0,255,136,0.45)'
                        }}
                    >
                        {message}
                    </div>
                )}

                <input
                    type="text"
                    placeholder="Search by symbol, company or sector"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={styles.search}
                />

                <div style={styles.filterRow}>
                    {SECTORS.map((sector) => (
                        <button
                            key={sector}
                            onClick={() => setSectorFilter(sector)}
                            style={{
                                ...styles.filterBtn,
                                background: sectorFilter === sector ? 'rgba(0,212,255,0.2)' : 'transparent',
                                borderColor: sectorFilter === sector ? '#00d4ff' : 'rgba(255,255,255,0.2)'
                            }}
                        >
                            {sector}
                        </button>
                    ))}
                </div>

                <div
                    style={{
                        ...styles.mainGrid,
                        gridTemplateColumns: selectedStock ? '1.2fr 1fr' : '1fr'
                    }}
                >
                    <div style={styles.tableCard}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Compare</th>
                                    <th style={styles.th}>Symbol</th>
                                    <th style={styles.th}>Company</th>
                                    <th style={styles.th}>Sector</th>
                                    <th style={styles.th}>Price</th>
                                    <th style={styles.th}>Volume</th>
                                    <th style={styles.th}>Watchlist</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStocks.map((stock) => (
                                    <tr
                                        key={stock.SYMBOL}
                                        onClick={() => handleStockClick(stock)}
                                        style={{
                                            ...styles.tr,
                                            background: selectedStock?.SYMBOL === stock.SYMBOL ? 'rgba(0,212,255,0.12)' : 'transparent'
                                        }}
                                    >
                                        <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={compareSymbols.includes(stock.SYMBOL)}
                                                onChange={() => toggleCompareSymbol(stock.SYMBOL)}
                                            />
                                        </td>
                                        <td style={styles.td}><span style={styles.symbol}>{stock.SYMBOL}</span></td>
                                        <td style={styles.td}>{stock.COMPANY_NAME}</td>
                                        <td style={styles.td}>{stock.SECTOR}</td>
                                        <td style={styles.td}>Rs {Number(stock.CURRENT_PRICE).toFixed(2)}</td>
                                        <td style={styles.td}>{Number(stock.VOLUME || 0).toLocaleString()}</td>
                                        <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                                            <button
                                                style={styles.watchBtn}
                                                onClick={() => openWatchlistModal(stock)}
                                            >
                                                + Watchlist
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {compareSymbols.length > 0 && (
                            <div style={styles.compareControls}>
                                <span style={styles.compareText}>Selected: {compareSymbols.join(', ')}</span>
                                <button
                                    onClick={loadComparison}
                                    disabled={compareSymbols.length < 2 || compareLoading}
                                    style={{
                                        ...styles.compareBtn,
                                        opacity: compareSymbols.length < 2 || compareLoading ? 0.6 : 1,
                                        cursor: compareSymbols.length < 2 || compareLoading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Compare
                                </button>
                            </div>
                        )}

                        {compareData.length > 0 && (
                            <div style={styles.compareChartCard}>
                                <h4 style={styles.chartTitle}>Stock Comparison ({selectedDays}D)</h4>
                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart data={compareData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                                        <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #00d4ff' }} />
                                        <Legend />
                                        {compareSymbols.map((symbol, idx) => (
                                            <Line
                                                key={symbol}
                                                type="monotone"
                                                dataKey={symbol}
                                                stroke={COMPARE_COLORS[idx % COMPARE_COLORS.length]}
                                                dot={false}
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {selectedStock && (
                        <div style={styles.detailCard}>
                            <h3 style={styles.detailTitle}>
                                {selectedStock.SYMBOL} - {selectedStock.COMPANY_NAME}
                            </h3>

                            <div style={styles.periodRow}>
                                {PERIODS.map((days) => (
                                    <button
                                        key={days}
                                        onClick={() => handlePeriodChange(days)}
                                        style={{
                                            ...styles.periodBtn,
                                            background: selectedDays === days ? 'rgba(0,212,255,0.2)' : 'transparent',
                                            borderColor: selectedDays === days ? '#00d4ff' : 'rgba(255,255,255,0.2)'
                                        }}
                                    >
                                        {days}D
                                    </button>
                                ))}
                            </div>

                            {selectedStockDetail && (
                                <div style={styles.infoGrid}>
                                    <div style={styles.infoItem}><p style={styles.infoLabel}>Company</p><p style={styles.infoValue}>{selectedStockDetail.COMPANY_NAME}</p></div>
                                    <div style={styles.infoItem}><p style={styles.infoLabel}>Sector</p><p style={styles.infoValue}>{selectedStockDetail.SECTOR}</p></div>
                                    <div style={styles.infoItem}><p style={styles.infoLabel}>Current</p><p style={styles.infoValue}>Rs {Number(selectedStockDetail.CLOSE_PRICE || 0).toFixed(2)}</p></div>
                                    <div style={styles.infoItem}><p style={styles.infoLabel}>Open</p><p style={styles.infoValue}>Rs {Number(selectedStockDetail.OPEN_PRICE || 0).toFixed(2)}</p></div>
                                    <div style={styles.infoItem}><p style={styles.infoLabel}>High</p><p style={{ ...styles.infoValue, color: '#00ff88' }}>Rs {Number(selectedStockDetail.HIGH_PRICE || 0).toFixed(2)}</p></div>
                                    <div style={styles.infoItem}><p style={styles.infoLabel}>Low</p><p style={{ ...styles.infoValue, color: '#ff6b6b' }}>Rs {Number(selectedStockDetail.LOW_PRICE || 0).toFixed(2)}</p></div>
                                    <div style={styles.infoItem}><p style={styles.infoLabel}>Volume</p><p style={styles.infoValue}>{Number(selectedStockDetail.VOLUME || 0).toLocaleString()}</p></div>
                                    <div style={styles.infoItem}><p style={styles.infoLabel}>Volatility</p><p style={styles.infoValue}>{Number(selectedStockDetail.VOLATILITY || 0).toFixed(2)}</p></div>
                                    <div style={styles.infoItem}><p style={styles.infoLabel}>Today Change %</p><p style={{ ...styles.infoValue, color: Number(selectedStockDetail.PCT_CHANGE || 0) >= 0 ? '#00ff88' : '#ff6b6b' }}>{Number(selectedStockDetail.PCT_CHANGE || 0).toFixed(2)}%</p></div>
                                    <div style={styles.infoItem}><p style={styles.infoLabel}>Price Change</p><p style={{ ...styles.infoValue, color: Number(selectedStockDetail.PRICE_CHANGE || 0) >= 0 ? '#00ff88' : '#ff6b6b' }}>Rs {Number(selectedStockDetail.PRICE_CHANGE || 0).toFixed(2)}</p></div>
                                    <div style={styles.infoItem}>
                                        <p style={styles.infoLabel}>Risk Level</p>
                                        <p style={{ ...styles.infoValue, color: riskColor(selectedStockDetail.RISK_LEVEL) }}>{selectedStockDetail.RISK_LEVEL}</p>
                                    </div>
                                </div>
                            )}

                            <h4 style={styles.chartTitle}>{selectedDays} Day Price History</h4>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                                    <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #00d4ff' }} />
                                    <Line type="monotone" dataKey="price" stroke="#00d4ff" dot={false} strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>

                            <div style={styles.newsCard}>
                                <h4 style={styles.chartTitle}>Related News</h4>
                                {relatedNews.length === 0 ? (
                                    <p style={styles.newsEmpty}>No recent related news.</p>
                                ) : (
                                    relatedNews.map((item) => (
                                        <div key={item.NEWS_ID} style={styles.newsItem}>
                                            <p style={styles.newsTitle}>{item.TITLE}</p>
                                            <p style={styles.newsMeta}>
                                                {item.SOURCE} - {new Date(item.PUBLISHED_DATE).toLocaleDateString()} - {item.CATEGORY}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showWatchModal && (
                <div style={styles.modalOverlay} onClick={closeWatchlistModal}>
                    <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <h3 style={styles.modalTitle}>Add to Watchlist</h3>
                        <p style={styles.modalSubtitle}>
                            {pendingStock?.SYMBOL} - {pendingStock?.COMPANY_NAME}
                        </p>
                        <label style={styles.modalLabel}>Notes (optional)</label>
                        <textarea
                            value={watchNote}
                            onChange={(e) => setWatchNote(e.target.value)}
                            placeholder="Example: Long term hold"
                            style={styles.modalInput}
                            rows={4}
                        />
                        <div style={styles.modalActions}>
                            <button style={styles.modalCancelBtn} onClick={closeWatchlistModal}>Cancel</button>
                            <button
                                style={styles.modalAddBtn}
                                onClick={handleAddToWatchlist}
                                disabled={addingWatch}
                            >
                                {addingWatch ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
    title: { color: 'white', marginBottom: '16px' },
    message: { border: '1px solid', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', fontWeight: 'bold' },
    search: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '16px', marginBottom: '14px', boxSizing: 'border-box' },
    filterRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
    filterBtn: { background: 'transparent', border: '1px solid', color: 'white', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' },
    mainGrid: { display: 'grid', gap: '20px' },
    tableCard: { background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { color: 'rgba(255,255,255,0.6)', padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' },
    tr: { cursor: 'pointer' },
    td: { padding: '12px', color: 'white', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    watchBtn: { background: 'transparent', border: '1px solid #00d4ff', color: '#00d4ff', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
    symbol: { background: 'rgba(0,212,255,0.2)', color: '#00d4ff', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' },
    compareControls: { marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' },
    compareText: { color: 'rgba(255,255,255,0.8)', fontSize: '13px' },
    compareBtn: { background: 'linear-gradient(135deg, #00d4ff, #0099ff)', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 14px' },
    compareChartCard: { marginTop: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' },
    detailCard: { background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '20px', border: '1px solid rgba(0,212,255,0.3)' },
    detailTitle: { color: '#00d4ff', marginBottom: '12px' },
    periodRow: { display: 'flex', gap: '8px', marginBottom: '12px' },
    periodBtn: { background: 'transparent', border: '1px solid', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' },
    infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' },
    infoItem: { background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px' },
    infoLabel: { margin: '0 0 5px 0', color: 'rgba(255,255,255,0.55)', fontSize: '12px' },
    infoValue: { margin: 0, fontWeight: 'bold', color: '#fff', fontSize: '14px' },
    chartTitle: { color: '#00d4ff', margin: '0 0 10px 0' },
    newsCard: { marginTop: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' },
    newsItem: { borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px 0' },
    newsTitle: { margin: 0, color: 'white', fontSize: '14px' },
    newsMeta: { margin: '4px 0 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '12px' },
    newsEmpty: { margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '13px' },
    modalOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 24, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999
    },
    modalCard: {
        width: 'min(520px, 92vw)',
        background: '#121631',
        border: '1px solid rgba(0,212,255,0.3)',
        borderRadius: '14px',
        padding: '18px'
    },
    modalTitle: { margin: '0 0 6px 0', color: '#00d4ff' },
    modalSubtitle: { margin: '0 0 12px 0', color: 'rgba(255,255,255,0.75)', fontSize: '13px' },
    modalLabel: { display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.75)' },
    modalInput: {
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.05)',
        color: 'white',
        padding: '10px',
        resize: 'vertical'
    },
    modalActions: { marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    modalCancelBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' },
    modalAddBtn: { background: 'linear-gradient(135deg, #00d4ff, #0099ff)', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer' }
};

export default Stocks;
