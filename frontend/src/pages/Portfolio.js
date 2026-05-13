import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    getUserPortfolios,
    getPortfolioHoldings,
    createPortfolio,
    buyStock,
    sellStock,
    getAllStocks,
    getUserByUsername,
    getPortfolioSummary,
    getPortfolioRiskScore,
    getPortfolioGrowth
} from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Portfolio() {
    const [portfolios, setPortfolios] = useState([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState(null);
    const [holdings, setHoldings] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [stocksLoading, setStocksLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showTradeForm, setShowTradeForm] = useState(false);
    const [tradeType, setTradeType] = useState('BUY');
    const [newPortfolioName, setNewPortfolioName] = useState('');
    const [tradeData, setTradeData] = useState({ company_id: '', quantity: '', price: '' });
    const [tradeMessage, setTradeMessage] = useState('');
    const [tradeMessageType, setTradeMessageType] = useState('');
    const [loading, setLoading] = useState(true);

    const [summary, setSummary] = useState(null);
    const [riskScore, setRiskScore] = useState(null);
    const [growthData, setGrowthData] = useState([]);

    const navigate = useNavigate();
    const location = useLocation();

    const userIdFromStorage = localStorage.getItem('user_id');
    const usernameFromStorage = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const currentUserIdValue = userIdFromStorage ? Number(userIdFromStorage) : null;

    const getNavBtnStyle = (path) => location.pathname === path
        ? { ...styles.navBtn, background: 'rgba(0,212,255,0.2)', border: '1px solid #00d4ff', color: '#00d4ff' }
        : styles.navBtn;

    const fetchData = useCallback(async () => {
        try {
            setStocksLoading(true);

            let resolvedUserId = currentUserIdValue;
            if (!resolvedUserId && usernameFromStorage) {
                const userResponse = await getUserByUsername(usernameFromStorage);
                resolvedUserId = Number(userResponse.data.data.USER_ID || userResponse.data.data.user_id);
                if (resolvedUserId) {
                    localStorage.setItem('user_id', String(resolvedUserId));
                }
            }

            if (!resolvedUserId) {
                localStorage.clear();
                navigate('/');
                return;
            }

            const [stocksRes, portfoliosRes] = await Promise.all([
                getAllStocks(),
                getUserPortfolios(resolvedUserId)
            ]);

            const stockRows = Array.isArray(stocksRes.data.data) ? stocksRes.data.data : [];
            const uniqueStocks = Array.from(
                new Map(stockRows.map((stock) => [stock.COMPANY_ID, stock])).values()
            );

            setCurrentUserId(resolvedUserId);
            setStocks(uniqueStocks);
            setPortfolios(portfoliosRes.data.data || []);
        } catch (error) {
            console.error('Error:', error);
            setTradeMessage(error.response?.data?.message || error.message || 'Failed to load portfolio data');
            setTradeMessageType('error');
        } finally {
            setStocksLoading(false);
            setLoading(false);
        }
    }, [currentUserIdValue, navigate, usernameFromStorage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (tradeMessageType !== 'error' || !tradeMessage) {
            return undefined;
        }

        const timerId = setTimeout(() => {
            setTradeMessage('');
            setTradeMessageType('');
        }, 3000);

        return () => clearTimeout(timerId);
    }, [tradeMessage, tradeMessageType]);

    const fetchPortfolioInsights = useCallback(async (portfolioId) => {
        try {
            const [holdingsRes, summaryRes, riskRes, growthRes] = await Promise.all([
                getPortfolioHoldings(portfolioId),
                getPortfolioSummary(portfolioId),
                getPortfolioRiskScore(portfolioId),
                getPortfolioGrowth(portfolioId)
            ]);

            const activeHoldings = (holdingsRes.data.data || []).filter((holding) => Number(holding.QUANTITY) > 0);
            setHoldings(activeHoldings);
            setSummary(summaryRes.data.data || null);
            setRiskScore(riskRes.data.data || null);

            const growth = (growthRes.data.data || []).map((row) => ({
                date: new Date(row.PRICE_DATE).toLocaleDateString(),
                value: Number(row.PORTFOLIO_VALUE || 0)
            }));
            setGrowthData(growth);
        } catch (error) {
            console.error('Error loading insights:', error);
        }
    }, []);

    const handlePortfolioClick = async (portfolio) => {
        setSelectedPortfolio(portfolio);
        await fetchPortfolioInsights(portfolio.PORTFOLIO_ID);
    };

    const handleCreatePortfolio = async () => {
        try {
            if (!currentUserId) {
                alert('Unable to determine the logged-in user. Please log in again.');
                return;
            }

            const portfolioName = newPortfolioName.trim().replace(/\s+/g, ' ');
            if (!portfolioName) {
                alert('Portfolio name is required.');
                return;
            }

            const normalizedNewName = portfolioName.toLowerCase();
            const duplicateExists = portfolios.some((portfolio) =>
                String(portfolio.PORTFOLIO_NAME || '').trim().replace(/\s+/g, ' ').toLowerCase() === normalizedNewName
            );

            if (duplicateExists) {
                alert('Portfolio name already exists for this user.');
                return;
            }

            await createPortfolio({
                user_id: currentUserId,
                portfolio_name: portfolioName
            });
            setNewPortfolioName('');
            setShowCreateForm(false);
            fetchData();
            alert('Portfolio created!');
        } catch (error) {
            console.error('Error:', error);
            const message = error.response?.data?.message || 'Portfolio creation failed';
            alert(message);
        }
    };

    const handleTrade = async () => {
        try {
            if (!selectedPortfolio) {
                setTradeMessage('Select a portfolio first.');
                setTradeMessageType('error');
                return;
            }

            const data = {
                portfolio_id: selectedPortfolio.PORTFOLIO_ID,
                company_id: tradeData.company_id,
                quantity: Number(tradeData.quantity),
                price: Number(tradeData.price)
            };

            if (tradeType === 'BUY') {
                await buyStock(data);
            } else {
                await sellStock(data);
            }

            setShowTradeForm(false);
            setTradeData({ company_id: '', quantity: '', price: '' });
            await fetchPortfolioInsights(selectedPortfolio.PORTFOLIO_ID);
            setTradeMessage(`${tradeType} successful!`);
            setTradeMessageType('success');
        } catch (error) {
            console.error('Error:', error);
            setTradeMessage(error.response?.data?.message || 'Trade failed!');
            setTradeMessageType('error');
        }
    };

    const getRiskColor = (level) => {
        if (level === 'HIGH RISK') return '#ff6b6b';
        if (level === 'MEDIUM RISK') return '#ffd700';
        return '#00ff88';
    };

    if (loading) return (
        <div style={styles.loading}>
            <h2 style={{ color: '#00d4ff' }}>Loading Portfolio...</h2>
        </div>
    );

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
                <div style={styles.header}>
                    <h2 style={styles.title}>My Portfolios</h2>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        style={styles.createBtn}
                    >
                        + New Portfolio
                    </button>
                </div>

                {showCreateForm && (
                    <div style={styles.formCard}>
                        <h3 style={styles.formTitle}>Create New Portfolio</h3>
                        <div style={styles.formRow}>
                            <input
                                type="text"
                                placeholder="Portfolio name..."
                                value={newPortfolioName}
                                onChange={(e) => setNewPortfolioName(e.target.value)}
                                style={styles.input}
                            />
                            <button onClick={handleCreatePortfolio} style={styles.submitBtn}>
                                Create
                            </button>
                        </div>
                    </div>
                )}

                {tradeMessage && (
                    <div
                        style={{
                            ...styles.message,
                            background: tradeMessageType === 'success' ? 'rgba(0,255,136,0.12)' : 'rgba(255,107,107,0.12)',
                            color: tradeMessageType === 'success' ? '#00ff88' : '#ff6b6b'
                        }}
                    >
                        {tradeMessage}
                    </div>
                )}

                <div style={styles.mainGrid}>
                    <div style={styles.portfoliosList}>
                        <h3 style={styles.sectionTitle}>Your Portfolios</h3>
                        {portfolios.length === 0 ? (
                            <p style={styles.empty}>No portfolios yet. Create one.</p>
                        ) : (
                            portfolios.map((p) => (
                                <div
                                    key={p.PORTFOLIO_ID}
                                    onClick={() => handlePortfolioClick(p)}
                                    style={{
                                        ...styles.portfolioItem,
                                        border: selectedPortfolio?.PORTFOLIO_ID === p.PORTFOLIO_ID
                                            ? '1px solid #00d4ff'
                                            : '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <h4 style={styles.portfolioName}>{p.PORTFOLIO_NAME}</h4>
                                    <p style={styles.portfolioDate}>Created: {new Date(p.CREATED_AT).toLocaleDateString()}</p>
                                    <p style={styles.portfolioMeta}>ID: {p.PORTFOLIO_ID}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {selectedPortfolio && (
                        <div style={styles.holdingsCard}>
                            <div style={styles.holdingsHeader}>
                                <h3 style={styles.sectionTitle}>
                                    {selectedPortfolio.PORTFOLIO_NAME} (ID: {selectedPortfolio.PORTFOLIO_ID})
                                </h3>
                                <button onClick={() => setShowTradeForm(!showTradeForm)} style={styles.tradeBtn}>
                                    Trade Stock
                                </button>
                            </div>

                            {summary && (
                                <div style={styles.summaryGrid}>
                                    <div style={styles.summaryCard}>
                                        <p style={styles.cardLabel}>Total Value</p>
                                        <p style={styles.cardValue}>Rs {Number(summary.TOTAL_VALUE || 0).toFixed(2)}</p>
                                    </div>
                                    <div style={styles.summaryCard}>
                                        <p style={styles.cardLabel}>Total Invested</p>
                                        <p style={styles.cardValue}>Rs {Number(summary.TOTAL_INVESTED || 0).toFixed(2)}</p>
                                    </div>
                                    <div style={styles.summaryCard}>
                                        <p style={styles.cardLabel}>Overall P and L</p>
                                        <p style={{ ...styles.cardValue, color: Number(summary.TOTAL_PL || 0) >= 0 ? '#00ff88' : '#ff6b6b' }}>
                                            Rs {Number(summary.TOTAL_PL || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div style={styles.summaryCard}>
                                        <p style={styles.cardLabel}>Overall P and L %</p>
                                        <p style={{ ...styles.cardValue, color: Number(summary.TOTAL_PL_PCT || 0) >= 0 ? '#00ff88' : '#ff6b6b' }}>
                                            {Number(summary.TOTAL_PL_PCT || 0).toFixed(2)}%
                                        </p>
                                    </div>
                                    <div style={styles.summaryCard}>
                                        <p style={styles.cardLabel}>Total Stocks</p>
                                        <p style={styles.cardValue}>{Number(summary.TOTAL_STOCKS || 0)}</p>
                                    </div>
                                </div>
                            )}

                            {riskScore && (
                                <div style={styles.riskCard}>
                                    <div>
                                        <p style={styles.cardLabel}>Portfolio Risk Level</p>
                                        <p style={{ ...styles.riskLevel, color: getRiskColor(riskScore.PORTFOLIO_RISK) }}>
                                            {riskScore.PORTFOLIO_RISK}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={styles.cardLabel}>Avg Volatility</p>
                                        <p style={styles.riskLevel}>{Number(riskScore.AVG_VOLATILITY || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            )}

                            {growthData.length > 0 && (
                                <div style={styles.growthCard}>
                                    <h4 style={styles.chartTitle}>Portfolio Value - Last 30 Days</h4>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <LineChart data={growthData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 10 }} />
                                            <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 10 }} />
                                            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #00d4ff' }} />
                                            <Line type="monotone" dataKey="value" stroke="#00d4ff" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {showTradeForm && (
                                <div style={styles.tradeForm}>
                                    <p style={styles.tradePortfolioText}>
                                        Trading in: {selectedPortfolio.PORTFOLIO_NAME} (ID: {selectedPortfolio.PORTFOLIO_ID})
                                    </p>
                                    {stocksLoading ? <p style={styles.loadingStocks}>Loading stocks...</p> : null}
                                    <div style={styles.tradeTypeRow}>
                                        <button
                                            onClick={() => setTradeType('BUY')}
                                            style={{
                                                ...styles.typeBtn,
                                                background: tradeType === 'BUY' ? '#00ff88' : 'transparent',
                                                color: tradeType === 'BUY' ? '#000' : '#00ff88'
                                            }}
                                        >BUY</button>
                                        <button
                                            onClick={() => setTradeType('SELL')}
                                            style={{
                                                ...styles.typeBtn,
                                                background: tradeType === 'SELL' ? '#ff6b6b' : 'transparent',
                                                color: tradeType === 'SELL' ? '#000' : '#ff6b6b'
                                            }}
                                        >SELL</button>
                                    </div>
                                    <select
                                        value={tradeData.company_id}
                                        onChange={(e) => setTradeData({ ...tradeData, company_id: e.target.value })}
                                        style={styles.select}
                                        disabled={stocksLoading}
                                    >
                                        <option value="">{stocksLoading ? 'Loading stocks...' : 'Select Stock'}</option>
                                        {stocks.map((s) => (
                                            <option key={s.COMPANY_ID} value={s.COMPANY_ID}>
                                                {s.SYMBOL} - Rs {s.CURRENT_PRICE}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Quantity"
                                        value={tradeData.quantity}
                                        onChange={(e) => setTradeData({ ...tradeData, quantity: e.target.value })}
                                        style={styles.input}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price per share"
                                        value={tradeData.price}
                                        onChange={(e) => setTradeData({ ...tradeData, price: e.target.value })}
                                        style={styles.input}
                                    />
                                    <button onClick={handleTrade} style={styles.submitBtn}>
                                        Execute {tradeType}
                                    </button>
                                </div>
                            )}

                            {holdings.length === 0 ? (
                                <p style={styles.empty}>No holdings yet. Buy some stocks.</p>
                            ) : (
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Symbol</th>
                                            <th style={styles.th}>Qty</th>
                                            <th style={styles.th}>Avg Price</th>
                                            <th style={styles.th}>Current</th>
                                            <th style={styles.th}>P and L</th>
                                            <th style={styles.th}>P and L %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {holdings.map((h) => (
                                            <tr key={h.SYMBOL}>
                                                <td style={styles.td}><span style={styles.symbol}>{h.SYMBOL}</span></td>
                                                <td style={styles.td}>{h.QUANTITY}</td>
                                                <td style={styles.td}>Rs {Number(h.AVG_BUY_PRICE || 0).toFixed(2)}</td>
                                                <td style={styles.td}>Rs {Number(h.CURRENT_PRICE || 0).toFixed(2)}</td>
                                                <td style={{ ...styles.td, color: Number(h.PROFIT_LOSS || 0) >= 0 ? '#00ff88' : '#ff6b6b' }}>
                                                    Rs {Number(h.PROFIT_LOSS || 0).toFixed(2)}
                                                </td>
                                                <td style={{ ...styles.td, color: Number(h.PL_PERCENTAGE || 0) >= 0 ? '#00ff88' : '#ff6b6b' }}>
                                                    {Number(h.PL_PERCENTAGE || 0).toFixed(2)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
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
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { color: 'white', margin: 0 },
    createBtn: { background: 'linear-gradient(135deg, #00d4ff, #0099ff)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
    formCard: { background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '20px', marginBottom: '20px', border: '1px solid rgba(0,212,255,0.3)' },
    formTitle: { color: '#00d4ff', marginBottom: '15px' },
    formRow: { display: 'flex', gap: '10px' },
    mainGrid: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' },
    portfoliosList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    sectionTitle: { color: '#00d4ff', marginBottom: '15px' },
    empty: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px' },
    portfolioItem: { background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px', cursor: 'pointer' },
    portfolioName: { color: 'white', margin: '0 0 5px 0' },
    portfolioDate: { color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 },
    portfolioMeta: { color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '6px 0 0 0' },
    holdingsCard: { background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' },
    holdingsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    tradeBtn: { background: 'linear-gradient(135deg, #00ff88, #00cc66)', border: 'none', color: '#000', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' },
    summaryCard: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '10px', padding: '12px' },
    cardLabel: { margin: '0 0 6px 0', color: 'rgba(255,255,255,0.65)', fontSize: '12px' },
    cardValue: { margin: 0, color: '#00d4ff', fontSize: '16px', fontWeight: 'bold' },
    riskCard: { display: 'flex', justifyContent: 'space-between', gap: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px', marginBottom: '16px' },
    riskLevel: { margin: 0, fontSize: '18px', fontWeight: 'bold' },
    growthCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', marginBottom: '16px' },
    chartTitle: { margin: '0 0 10px 0', color: '#00d4ff' },
    tradeForm: { background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
    tradePortfolioText: { color: '#00d4ff', fontSize: '13px', margin: 0 },
    loadingStocks: { color: 'rgba(255,255,255,0.6)', margin: 0 },
    tradeTypeRow: { display: 'flex', gap: '10px' },
    typeBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontWeight: 'bold' },
    select: {
        padding: '12px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.2)',
        background: '#1a1a2e',
        color: 'white',
        fontSize: '14px',
        width: '100%',
        cursor: 'pointer'
    },
    input: { padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px' },
    submitBtn: { padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #00d4ff, #0099ff)', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
    message: { padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontWeight: 'bold' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { color: 'rgba(255,255,255,0.6)', padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' },
    td: { padding: '12px', color: 'white', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    symbol: { background: 'rgba(0,212,255,0.2)', color: '#00d4ff', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }
};

export default Portfolio;
