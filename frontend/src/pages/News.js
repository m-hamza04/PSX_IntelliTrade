import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllNews, getNewsById } from '../services/api';

const FILTERS = ['ALL', 'Market', 'Sector', 'Economy', 'Regulatory'];

function News() {
    const [news, setNews] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [expandedId, setExpandedId] = useState(null);
    const [detailsMap, setDetailsMap] = useState({});
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem('role');

    const getNavBtnStyle = (path) => location.pathname === path
        ? { ...styles.navBtn, background: 'rgba(0,212,255,0.2)', border: '1px solid #00d4ff', color: '#00d4ff' }
        : styles.navBtn;

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await getAllNews();
                setNews(res.data.data || []);
            } catch (error) {
                console.error('Error loading news:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    const filteredNews = useMemo(() => {
        if (filter === 'ALL') return news;
        return news.filter((n) => String(n.CATEGORY || '').toLowerCase() === filter.toLowerCase());
    }, [filter, news]);

    const categoryColor = (category) => {
        const key = String(category || '').toLowerCase();
        if (key === 'market') return '#00d4ff';
        if (key === 'sector') return '#00ff88';
        if (key === 'economy') return '#ffd700';
        if (key === 'regulatory') return '#ff6b6b';
        return '#9aa3b2';
    };

    const impactColor = (impact) => {
        const key = String(impact || '').toUpperCase();
        if (key === 'POSITIVE') return '#00ff88';
        if (key === 'NEUTRAL') return '#9aa3b2';
        return '#ff6b6b';
    };

    const toggleExpand = async (newsId) => {
        if (expandedId === newsId) {
            setExpandedId(null);
            return;
        }

        setExpandedId(newsId);
        if (!detailsMap[newsId]) {
            try {
                const res = await getNewsById(newsId);
                setDetailsMap((prev) => ({ ...prev, [newsId]: res.data.data }));
            } catch (error) {
                console.error('Error fetching news detail:', error);
            }
        }
    };

    if (loading) {
        return <div style={styles.loading}><h2 style={{ color: '#00d4ff' }}>Loading News...</h2></div>;
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
                <h2 style={styles.title}>Market News</h2>

                <div style={styles.filters}>
                    {FILTERS.map((item) => (
                        <button
                            key={item}
                            style={{
                                ...styles.filterBtn,
                                background: filter === item ? 'rgba(0,212,255,0.2)' : 'transparent',
                                borderColor: filter === item ? '#00d4ff' : 'rgba(255,255,255,0.2)'
                            }}
                            onClick={() => setFilter(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div style={styles.list}>
                    {filteredNews.map((item) => {
                        const detail = detailsMap[item.NEWS_ID];
                        const expanded = expandedId === item.NEWS_ID;
                        return (
                            <div key={item.NEWS_ID} style={styles.card} onClick={() => toggleExpand(item.NEWS_ID)}>
                                <div style={styles.topRow}>
                                    <h3 style={styles.cardTitle}>{item.TITLE}</h3>
                                    <span style={{ ...styles.category, color: categoryColor(item.CATEGORY), borderColor: categoryColor(item.CATEGORY) }}>{item.CATEGORY}</span>
                                </div>
                                <p style={styles.meta}>{item.SOURCE} - {new Date(item.PUBLISHED_DATE).toLocaleDateString()}</p>

                                {expanded && detail ? (
                                    <>
                                        <p style={styles.contentText}>{detail.CONTENT}</p>
                                        <div style={styles.chipsWrap}>
                                            {(detail.AFFECTED_COMPANIES || []).map((c) => (
                                                <span key={`${item.NEWS_ID}-${c.COMPANY_ID}`} style={{ ...styles.chip, color: impactColor(c.IMPACT), borderColor: impactColor(c.IMPACT) }}>
                                                    {c.SYMBOL} ({c.IMPACT})
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        );
                    })}
                    {filteredNews.length === 0 ? <p style={styles.empty}>No news found.</p> : null}
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
    filters: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
    filterBtn: { background: 'transparent', border: '1px solid', color: 'white', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' },
    list: { display: 'flex', flexDirection: 'column', gap: '12px' },
    card: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', cursor: 'pointer' },
    topRow: { display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' },
    cardTitle: { margin: 0, fontSize: '18px' },
    category: { border: '1px solid', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold' },
    meta: { margin: '8px 0', color: 'rgba(255,255,255,0.65)', fontSize: '13px' },
    contentText: { margin: '8px 0 10px 0', color: 'white', lineHeight: 1.55 },
    chipsWrap: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    chip: { border: '1px solid', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold' },
    empty: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '20px' }
};

export default News;
