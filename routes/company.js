const express = require('express');
const router = express.Router();
const { Company } = require('../models');
const { authenticateJWT } = require('../middleware/authenticateJWT');

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: "회사의 목록을 조회"
 *     description: "전체 회사 목록을 조회합니다."
 *     responses:
 *       200:
 *         description: "회사의 목록 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "회사를 가져오는 중 오류가 발생했습니다."
 */

/**
 * 회사 목록을 조회하는 API 엔드포인트
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * 
 * @throws {Error} 회사 목록을 조회하는 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체 또는 서버 오류 시 500 응답 객체
 */
// 회사 목록 조회 (GET /companies)
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const companies = await Company.findAll();
        res.status(200).json({
            status: 'success',
            data: companies,
        });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({
            status: 'error',
            message: '회사를 가져오는 중 오류가 발생했습니다.',
        });
    }
});

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: "특정 회사를 조회"
 *     description: "특정 ID를 가진 회사를 조회합니다."
 *     parameters:
 *       - name: id
 *         in: path
 *         description: "조회할 회사의 ID"
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "회사 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *       404:
 *         description: "회사를 찾을 수 없음"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "해당 회사를 찾을 수 없습니다."
 *       500:
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "회사를 조회하는 중 오류가 발생했습니다."
 */

/**
 * 특정 회사 정보를 조회하는 API 엔드포인트
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * 
 * @throws {Error} 회사 조회 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체, 또는 회사가 존재하지 않을 경우 404, 서버 오류 시 500 응답 객체
 */
// 특정 회사 조회 (GET /companies/:id)
router.get('/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const company = await Company.findByPk(id);

        if (!company) {
            return res.status(404).json({
                status: 'error',
                message: '해당 회사를 찾을 수 없습니다.',
            });
        }

        res.status(200).json({
            status: 'success',
            data: company,
        });
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({
            status: 'error',
            message: '회사를 조회하는 중 오류가 발생했습니다.',
        });
    }
});

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: "새로운 회사 추가"
 *     description: "새로운 회사를 시스템에 추가합니다."
 *     requestBody:
 *       description: "새로운 회사의 데이터"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               industry:
 *                 type: string
 *               website:
 *                 type: string
 *               contact_number:
 *                 type: string
 *                 pattern: "^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$"
 *     responses:
 *       201:
 *         description: "회사 추가 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *       400:
 *         description: "잘못된 요청 (필수 값 누락 또는 전화번호 형식 오류)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "모든 필수 값을 입력해 주세요."
 *       500:
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "회사를 추가하는 중 오류가 발생했습니다."
 */

/**
 * 새로운 회사를 추가하는 API 엔드포인트
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * 
 * @throws {Error} 회사를 추가하는 중 발생한 오류
 * 
 * @returns {Object} 201 Created 응답 객체, 또는 유효성 검사 오류 시 400, 서버 오류 시 500 응답 객체
 */

// 새로운 회사 추가 (POST /companies)
router.post('/', authenticateJWT, async (req, res) => {
    const { name, location, industry, website, contact_number } = req.body;

    // 유효성 검사: 필수 값이 모두 있는지 확인
    if (!name || !location || !industry || !contact_number) {
        return res.status(400).json({
            status: 'error',
            message: '모든 필수 값을 입력해 주세요.',
        });
    }

    // contact_number 형식 검증 (정규 표현식으로 확인)
    const contactNumberPattern = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/;
    if (!contactNumberPattern.test(contact_number)) {
        return res.status(400).json({
            status: 'error',
            message: '전화번호는 000-000-0000나 000-0000-0000 형식이어야 합니다.',
        });
    }

    try {
        const newCompany = await Company.create({
            name,
            location,
            industry,
            website,
            contact_number,
        });

        res.status(201).json({
            status: 'success',
            data: newCompany,
        });
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({
            status: 'error',
            message: '회사를 추가하는 중 오류가 발생했습니다.',
        });
    }
});

module.exports = router;
