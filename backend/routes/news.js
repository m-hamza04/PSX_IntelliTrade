const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');
const oracledb = require('oracledb');

// ================================
// GET ALL NEWS
// GET /api/news
// ================================
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT news_id, title, source, category, published_date
             FROM news
             ORDER BY published_date DESC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        if (connection) await connection.close();
    }
});

// ================================
// GET LATEST NEWS (TOP 5)
// GET /api/news/latest
// ================================
router.get('/latest', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT news_id, title, source, category, published_date
             FROM news
             ORDER BY published_date DESC
             FETCH FIRST 5 ROWS ONLY`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        if (connection) await connection.close();
    }
});

// ================================
// GET COMPANY NEWS
// GET /api/news/company/:company_id
// ================================
router.get('/company/:company_id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT n.news_id,
                    n.title,
                    n.content,
                    n.source,
                    n.category,
                    n.published_date,
                    cn.impact,
                    cn.added_date
             FROM company_news cn
             JOIN news n ON cn.news_id = n.news_id
             WHERE cn.company_id = :company_id
             ORDER BY n.published_date DESC`,
            { company_id: req.params.company_id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        if (connection) await connection.close();
    }
});

// ================================
// GET SINGLE NEWS WITH COMPANIES
// GET /api/news/:news_id
// ================================
router.get('/:news_id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const newsResult = await connection.execute(
            `SELECT news_id, title, content, source, category, published_date
             FROM news
             WHERE news_id = :news_id`,
            { news_id: req.params.news_id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!newsResult.rows || newsResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'News article not found'
            });
        }

        const companiesResult = await connection.execute(
            `SELECT c.company_id,
                    c.symbol,
                    c.company_name,
                    cn.impact,
                    cn.added_date
             FROM company_news cn
             JOIN companies c ON cn.company_id = c.company_id
             WHERE cn.news_id = :news_id
             ORDER BY c.symbol`,
            { news_id: req.params.news_id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const newsData = newsResult.rows[0];
        newsData.AFFECTED_COMPANIES = companiesResult.rows;

        res.json({
            success: true,
            data: newsData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;
