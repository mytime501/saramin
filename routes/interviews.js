const express = require('express');
const router = express.Router();
const { Interview, Application } = require('../models');
const { authenticateJWT } = require('../middleware/authenticateJWT');
const { Op } = require('sequelize');

/**
 * @swagger
 * /interviews:
 *   get:
 *     summary: "인터뷰 목록 조회"
 *     description: "사용자가 지원한 모든 인터뷰 목록을 조회합니다."
 *     responses:
 *       200:
 *         description: "인터뷰 목록 조회 성공"
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
 *                   example: "인터뷰 조회 중 오류가 발생했습니다."
 */

/**
 * 사용자가 지원한 모든 인터뷰 목록을 조회하는 API 엔드포인트
 * 
 * @param {Object} req - Express 요청 객체 (사용자 인증 정보를 포함)
 * @param {Object} res - Express 응답 객체
 * 
 * @throws {Error} 인터뷰 목록을 조회하는 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체 또는 서버 오류 시 500 응답 객체
 */

// 인터뷰 목록 조회 API (GET /interviews)
router.get('/', authenticateJWT, async (req, res) => {
    const userId = req.user.id;

    try {
        const interviews = await Interview.findAll();

        res.status(200).json({
            status: 'success',
            data: interviews,
        });
    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({
            status: 'error',
            message: '인터뷰 조회 중 오류가 발생했습니다.',
        });
    }
});

/**
 * @swagger
 * /interviews:
 *   post:
 *     summary: "인터뷰 생성"
 *     description: "지원한 공고에 대한 인터뷰를 생성합니다."
 *     requestBody:
 *       description: "인터뷰 정보를 포함한 요청 본문"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               applicationId:
 *                 type: string
 *                 description: "지원한 공고의 ID"
 *               interview_date:
 *                 type: string
 *                 format: date-time
 *                 description: "인터뷰 날짜"
 *               feedback:
 *                 type: string
 *                 description: "인터뷰 피드백"
 *     responses:
 *       201:
 *         description: "인터뷰 생성 성공"
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
 *       403:
 *         description: "사용자가 지원하지 않은 공고에 대한 인터뷰를 생성하려고 시도"
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
 *                   example: "본인이 지원한 공고에 대해서만 인터뷰를 작성할 수 있습니다."
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
 *                   example: "인터뷰 생성 중 오류가 발생했습니다."
 */

/**
 * 새로운 인터뷰를 생성하는 API 엔드포인트
 * 
 * @param {Object} req - Express 요청 객체 (사용자 인증 정보 및 인터뷰 데이터 포함)
 * @param {Object} res - Express 응답 객체
 * 
 * @throws {Error} 인터뷰 생성 중 발생한 오류
 * 
 * @returns {Object} 201 Created 응답 객체, 또는 403 Forbidden 응답 객체(잘못된 공고 ID의 경우), 서버 오류 시 500 응답 객체
 */

// 인터뷰 생성 API (POST /interviews)
router.post('/', authenticateJWT, async (req, res) => {
    const { applicationId, interview_date, feedback } = req.body; // feedback 추가
    const userId = req.user.id;

    try {
        // 사용자가 지원한 공고인지 확인
        const application = await Application.findOne({
            where: { id: applicationId, userId },
        });

        if (!application) {
            return res.status(403).json({
                status: 'error',
                message: '본인이 지원한 공고에 대해서만 인터뷰를 작성할 수 있습니다.',
            });
        }

        // `Application`의 `status` 가져오기
        const interview_status = application.status;

        // 인터뷰 생성
        const interview = await Interview.create({
            applicationId,
            userId,
            interview_date,
            interview_status, // Application의 status 값
            feedback, // 요청으로 받은 feedback 값
        });

        res.status(201).json({
            status: 'success',
            data: interview,
        });
    } catch (error) {
        console.error('Error creating interview:', error);
        res.status(500).json({
            status: 'error',
            message: '인터뷰 생성 중 오류가 발생했습니다.',
        });
    }
});

/**
 * @swagger
 * /interviews/{applicationId}:
 *   put:
 *     summary: "인터뷰 수정"
 *     description: "인터뷰 피드백을 수정합니다."
 *     parameters:
 *       - name: applicationId
 *         in: path
 *         description: "수정할 인터뷰의 applicationId"
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: "수정할 인터뷰 피드백"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feedback:
 *                 type: string
 *                 description: "수정된 인터뷰 피드백"
 *     responses:
 *       200:
 *         description: "인터뷰 수정 성공"
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
 *       403:
 *         description: "인터뷰 상태가 예정 상태가 아니므로 수정할 수 없음"
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
 *                   example: "인터뷰 상태가 예정 상태가 아니므로 수정할 수 없습니다."
 *       404:
 *         description: "해당 인터뷰를 찾을 수 없음"
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
 *                   example: "해당 인터뷰를 찾을 수 없습니다."
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
 *                   example: "인터뷰 수정 중 오류가 발생했습니다."
 */

/**
 * 인터뷰 피드백을 수정하는 API 엔드포인트
 * 
 * @param {Object} req - Express 요청 객체 (수정할 피드백 및 인터뷰 ID 포함)
 * @param {Object} res - Express 응답 객체
 * 
 * @throws {Error} 인터뷰 수정 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체, 403 Forbidden 응답 객체 (상태에 따라), 404 Not Found 응답 객체 (인터뷰 미존재 시), 500 응답 객체 (서버 오류)
 */

// 인터뷰 수정 API (PUT /interviews/:id)
router.put('/:applicationId', authenticateJWT, async (req, res) => {
    const { applicationId } = req.params;  // URL에서 interview ID 가져오기
    const { feedback } = req.body; // feedback만 요청받음
    const userId = req.user.id;

    try {
        // 해당 interview 찾기
        const interview = await Interview.findOne({
            where: { applicationId, userId },
            include: [
                {
                    model: Application,
                    required: true,
                    attributes: ['status'], // Application의 status를 가져오기 위해 포함
                },
            ],
        });

        if (!interview) {
            return res.status(404).json({
                status: 'error',
                message: '해당 인터뷰를 찾을 수 없습니다.',
            });
        }

        // 지원자가 본인이 지원한 공고에 대해서만 수정할 수 있도록 체크
        if (interview.Application.status !== "면접 완료") {
            return res.status(403).json({
                status: 'error',
                message: '인터뷰 상태가 예정 상태가 아니므로 수정할 수 없습니다.',
            });
        }

        // feedback만 수정
        interview.feedback = feedback;
        interview.updatedAt = new Date(); // 수정 시간 갱신

        await interview.save();

        res.status(200).json({
            status: 'success',
            data: interview,
        });
    } catch (error) {
        console.error('Error updating interview:', error);
        res.status(500).json({
            status: 'error',
            message: '인터뷰 수정 중 오류가 발생했습니다.',
        });
    }
});

/**
 * @swagger
 * /interviews/{id}:
 *   delete:
 *     summary: "인터뷰 삭제"
 *     description: "인터뷰를 삭제합니다."
 *     parameters:
 *       - name: id
 *         in: path
 *         description: "삭제할 인터뷰의 ID"
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "인터뷰 삭제 성공"
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
 *                   example: "인터뷰가 삭제되었습니다."
 *       404:
 *         description: "인터뷰를 찾을 수 없음"
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
 *                   example: "해당 인터뷰를 찾을 수 없거나 권한이 없습니다."
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
 *                   example: "인터뷰 삭제 중 오류가 발생했습니다."
 */

/**
 * 인터뷰를 삭제하는 API 엔드포인트
 * 
 * @param {Object} req - Express 요청 객체 (삭제할 인터뷰 ID 포함)
 * @param {Object} res - Express 응답 객체
 * 
 * @throws {Error} 인터뷰 삭제 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체, 404 Not Found 응답 객체 (인터뷰 미존재 시), 500 응답 객체 (서버 오류)
 */

// 인터뷰 삭제 API (DELETE /interviews/:id)
router.delete('/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // 인터뷰 조회
        const interview = await Interview.findOne({
            where: { id, userId },
        });

        if (!interview) {
            return res.status(404).json({
                status: 'error',
                message: '해당 인터뷰를 찾을 수 없거나 권한이 없습니다.',
            });
        }

        // 인터뷰 삭제
        await interview.destroy();

        res.status(200).json({
            status: 'success',
            message: '인터뷰가 삭제되었습니다.',
        });
    } catch (error) {
        console.error('Error deleting interview:', error);
        res.status(500).json({
            status: 'error',
            message: '인터뷰 삭제 중 오류가 발생했습니다.',
        });
    }
});

module.exports = router;
