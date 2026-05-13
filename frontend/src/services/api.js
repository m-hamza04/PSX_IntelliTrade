import axios from 'axios';

// Backend ka base URL
const API = axios.create({
    baseURL: 'http://localhost:5000/api'
});

// ================================
// AUTH APIs
// ================================
export const loginUser = (data) => 
    API.post('/auth/login', data);

export const getUserByUsername = (username) =>
    API.get(`/auth/user/${encodeURIComponent(username)}`);

export const registerUser = (data) => 
    API.post('/auth/register', data);

// ================================
// STOCKS APIs
// ================================
export const getAllStocks = () => 
    API.get('/stocks');

export const getStockHistory = (symbol, days = 30) => 
    API.get(`/stocks/${symbol}/history?days=${days}`);

export const getStockDetail = (symbol) =>
    API.get('/stocks/' + symbol + '/detail');

export const getTopGainers = () => 
    API.get('/stocks/gainers');

export const getTopLosers = () => 
    API.get('/stocks/losers');

export const getRiskScores = () => 
    API.get('/stocks/risk');

// ================================
// PORTFOLIO APIs
// ================================
export const getUserPortfolios = (userId) => 
    API.get(`/portfolio/${userId}`);

export const createPortfolio = (data) => 
    API.post('/portfolio/create', data);

export const getPortfolioHoldings = (portfolioId) => 
    API.get(`/portfolio/${portfolioId}/holdings`);

export const getUserTransactions = (userId) =>
    API.get('/portfolio/' + userId + '/transactions');

export const getPortfolioSummary = (portfolioId) =>
    API.get('/portfolio/' + portfolioId + '/summary');

export const getPortfolioRiskScore = (portfolioId) =>
    API.get('/portfolio/' + portfolioId + '/risk');

export const getPortfolioGrowth = (portfolioId) =>
    API.get('/portfolio/' + portfolioId + '/growth');

export const buyStock = (data) => 
    API.post('/portfolio/buy', data);

export const sellStock = (data) => 
    API.post('/portfolio/sell', data);

// ================================
// ANALYTICS APIs
// ================================
export const getMarketSummary = () => 
    API.get('/analytics/market');

export const getSectorPerformance = () => 
    API.get('/analytics/sectors');

export const getAlerts = () => 
    API.get('/analytics/alerts');

export const markAlertRead = (alertId) =>
    API.put('/analytics/alerts/' + alertId + '/read');

export const getPortfolioRisk = (portfolioId) => 
    API.get(`/analytics/risk/${portfolioId}`);

export const activateUser = (userId) =>
    API.put('/admin/users/' + userId + '/activate');

// ================================
// WATCHLIST APIs
// ================================
export const getUserWatchlist = (userId) =>
    API.get('/watchlist/' + userId);

export const addToWatchlist = (data) =>
    API.post('/watchlist/add', data);

export const removeFromWatchlist = (data) =>
    API.delete('/watchlist/remove', { data });

// ================================
// MARKET INDICES APIs
// ================================
export const getAllIndices = () =>
    API.get('/indices');

export const getIndexStocks = (indexId) =>
    API.get('/indices/' + indexId + '/stocks');

// ================================
// NEWS APIs
// ================================
export const getAllNews = () =>
    API.get('/news');

export const getLatestNews = () =>
    API.get('/news/latest');

export const getNewsById = (newsId) =>
    API.get('/news/' + newsId);

export const getNewsByCompany = (companyId) =>
    API.get('/news/company/' + companyId);