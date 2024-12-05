const express = require('express');
const router = express.Router();
const { Bookmark, Job } = require('../models');
const { authenticateJWT } = require('../middleware/authenticateJWT');

/**
 * @swagger
 * /bookmarks:
 *   post:
 *     summary: "북마크 추가/제거"
 *     description: "주어진 채용 공고를 북마크하거나 이미 북마크된 경우 이를 제거합니다."
 *     requestBody:
 *       description: "북마크할 채용 공고의 ID"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: "북마크할 채용 공고의 ID"
 *     responses:
 *       200:
 *         description: "북마크 제거 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "북마크가 제거되었습니다."
 *       201:
 *         description: "북마크 추가 성공"
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
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: "북마크 ID"
 *                     userId:
 *                       type: string
 *                       description: "사용자 ID"
 *                     jobId:
 *                       type: string
 *                       description: "채용 공고 ID"
 *       400:
 *         description: "채용 공고 ID가 제공되지 않음"
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
 *                   example: "채용 공고 ID가 필요합니다."
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
 *                   example: "북마크 처리 중 오류가 발생했습니다."
 */

/**
 * 사용자가 지정한 채용 공고를 북마크하거나, 이미 북마크된 경우 이를 제거하는 API 엔드포인트
 * 
 * @param {Object} req - Express 요청 객체 (사용자 인증 정보 및 jobId 포함)
 * @param {Object} res - Express 응답 객체
 * 
 * @throws {Error} 북마크 추가 또는 제거 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체 (북마크 제거 성공), 201 Created 응답 객체 (북마크 추가 성공), 
 * 400 Bad Request 응답 객체 (채용 공고 ID 누락), 500 Internal Server Error 응답 객체 (서버 오류)
 */

// 북마크 추가/제거 API (POST /bookmarks)
router.post('/', authenticateJWT, async (req, res) => {
    const { jobId } = req.body;

    if (!jobId) {
        return res.status(400).json({
            status: 'error',
            message: '채용 공고 ID가 필요합니다.',
        });
    }

    try {
        const existingBookmark = await Bookmark.findOne({
            where: { userId: req.user.id, jobId },
        });

        if (existingBookmark) {
            // 이미 북마크된 경우 제거
            await existingBookmark.destroy();
            return res.status(200).json({
                status: 'success',
                message: '북마크가 제거되었습니다.',
            });
        } else {
            // 북마크 추가
            const bookmark = await Bookmark.create({
                userId: req.user.id,
                jobId,
            });
            return res.status(201).json({
                status: 'success',
                data: bookmark,
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: '북마크 처리 중 오류가 발생했습니다.',
        });
    }
});

/**
 * @swagger
 * /bookmarks:
 *   get:
 *     summary: "북마크 목록 조회"
 *     description: "사용자가 북마크한 채용 공고 목록을 페이지네이션을 통해 조회합니다."
 *     parameters:
 *       - name: page
 *         in: query
 *         description: "조회할 페이지 번호 (기본값: 1)"
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: "한 페이지에 표시할 항목 수 (기본값: 10)"
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: "북마크 목록 조회 성공"
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalCount:
 *                       type: integer
 *                       description: "전체 북마크 수"
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       description: "전체 페이지 수"
 *                       example: 5
 *                     currentPage:
 *                       type: integer
 *                       description: "현재 페이지"
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       description: "한 페이지에 표시되는 항목 수"
 *                       example: 10
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
 *                   example: "북마크 목록 조회 중 오류가 발생했습니다."
 */

/**
 * 사용자가 북마크한 채용 공고 목록을 페이지네이션을 통해 조회하는 API 엔드포인트
 * 
 * @param {Object} req - Express 요청 객체 (사용자 인증 정보 및 query 파라미터 포함)
 * @param {Object} res - Express 응답 객체
 * 
 * @throws {Error} 북마크 목록 조회 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체 (북마크 목록 조회 성공), 500 Internal Server Error 응답 객체 (서버 오류)
 */

// 북마크 목록 조회 API (GET /bookmarks)
router.get('/', authenticateJWT, async (req, res) => {
    // 클라이언트로부터 page와 limit 값을 받아옵니다.
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit; // 페이지 번호를 기반으로 시작 위치 계산

    try {
        // 전체 북마크 수를 먼저 구합니다.
        const totalCount = await Bookmark.count({
            where: { userId: req.user.id },
        });

        // 해당 페이지에 맞는 북마크들을 조회합니다.
        const bookmarks = await Bookmark.findAll({
            where: { userId: req.user.id },
            include: { model: Job, as: 'job' },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
        });

        // 페이지네이션 정보를 응답에 추가합니다.
        res.status(200).json({
            status: 'success',
            data: bookmarks,
            pagination: {
                totalCount, // 전체 아이템 수
                totalPages: Math.ceil(totalCount / limit), // 전체 페이지 수
                currentPage: parseInt(page, 10), // 현재 페이지
                pageSize: parseInt(limit, 10), // 페이지 크기
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: '북마크 목록 조회 중 오류가 발생했습니다.',
        });
    }
});


module.exports = router;
