const express = require('express');
const router = express.Router();
const { JobReview } = require('../models');
const { authenticateJWT } = require('../middleware/authenticateJWT');

/**
 * @swagger
 * /jobreviews/{jobId}:
 *   get:
 *     summary: "특정 공고에 대한 리뷰 조회"
 *     description: "특정 채용 공고에 대한 리뷰를 조회합니다."
 *     parameters:
 *       - name: jobId
 *         in: path
 *         description: "리뷰를 조회할 채용 공고의 ID"
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "리뷰 조회 성공"
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
 *       404:
 *         description: "리뷰를 찾을 수 없음"
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
 *                   example: "해당 공고에 대한 리뷰를 찾을 수 없습니다."
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
 *                   example: "리뷰를 가져오는 중 오류가 발생했습니다."
 */

/**
 * 특정 공고에 대한 리뷰를 조회하는 API 엔드포인트
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * 
 * @throws {Error} 리뷰를 조회하는 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체, 또는 오류 메시지를 포함한 404, 500 응답 객체
 */

// 특정 공고의 리뷰 조회 (GET /jobreviews/:jobId)
router.get('/:jobId', authenticateJWT, async (req, res) => {
    try {
        const { jobId } = req.params;
        const reviews = await JobReview.findAll({ where: { jobId } });

        if (reviews.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: '해당 공고에 대한 리뷰를 찾을 수 없습니다.',
            });
        }

        res.status(200).json({
            status: 'success',
            data: reviews,
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            status: 'error',
            message: '리뷰를 가져오는 중 오류가 발생했습니다.',
        });
    }
});

/**
 * @swagger
 * /jobreviews:
 *   post:
 *     summary: "새로운 리뷰 작성"
 *     description: "새로운 채용 공고에 리뷰를 작성합니다."
 *     requestBody:
 *       description: "새로운 리뷰의 데이터"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *               review_text:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       201:
 *         description: "리뷰 작성 성공"
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
 *         description: "잘못된 요청 (잘못된 rating 값)"
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
 *                   example: "Rating은 1부터 10까지의 숫자여야 합니다."
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
 *                   example: "리뷰를 작성하는 중 오류가 발생했습니다."
 */

/**
 * 새로운 리뷰를 작성하는 API 엔드포인트
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * 
 * @throws {Error} 리뷰를 작성하는 중 발생한 오류
 * 
 * @returns {Object} 201 Created 응답 객체, 또는 오류 메시지를 포함한 400, 500 응답 객체
 */
// 새로운 리뷰 작성 (POST /jobreviews)
router.post('/', authenticateJWT, async (req, res) => {
    const { jobId, review_text, rating } = req.body;  // 클라이언트에서 보내는 데이터

    // rating 값이 1~10 사이인지 확인
    if (rating < 1 || rating > 5) {
        return res.status(400).json({
            status: 'error',
            message: 'Rating은 1부터 10까지의 숫자여야 합니다.',
        });
    }

    try {
        // 현재 로그인한 사용자의 ID를 사용
        const userId = req.user.id;

        // 새로운 리뷰 생성
        const newReview = await JobReview.create({
            jobId,
            userId,  // 현재 로그인한 사용자 ID
            review_text,
            rating,
            createdAt: new Date(),  // 현재 시간으로 설정
            updatedAt: new Date(),  // 현재 시간으로 설정
        });

        res.status(201).json({
            status: 'success',
            data: newReview,
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({
            status: 'error',
            message: '리뷰를 작성하는 중 오류가 발생했습니다.',
        });
    }
});


module.exports = router;
