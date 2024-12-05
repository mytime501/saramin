const express = require('express');
const router = express.Router();
const { Application, Job, User, sequelize } = require('../models');
const { authenticateJWT, authorizeRoles } = require('../middleware/authenticateJWT');

/**
 * @swagger
 * /applications:
 *   post:
 *     summary: "채용 공고에 지원"
 *     description: "사용자가 채용 공고에 지원하는 API. 기존 지원이 있으면 '지원 완료' 상태로 변경하고, 없으면 새로 지원서를 작성합니다."
 *     requestBody:
 *       description: "지원할 채용 공고 정보"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: integer
 *                 description: "채용 공고 ID"
 *               resume:
 *                 type: string
 *                 description: "이력서 내용"
 *     responses:
 *       201:
 *         description: "지원 성공"
 *       400:
 *         description: "잘못된 요청 (예: 채용 공고 ID 미제공, 이미 지원한 경우)"
 *       404:
 *         description: "채용 공고를 찾을 수 없음"
 *       500:
 *         description: "서버 오류"
 */

/**
 * 사용자가 채용 공고에 지원하거나 기존 지원 상태를 변경하는 API
 * 
 * @param {Object} req - Express 요청 객체, `jobId`와 `resume` 포함
 * @param {Object} res - Express 응답 객체, 성공 시 지원한 데이터 반환
 * 
 * @throws {Error} 채용 공고를 찾을 수 없거나 이미 지원한 경우
 * 
 * @returns {Object} 201 Created 응답 객체 (지원 성공), 400 Bad Request 응답 객체 (잘못된 입력), 
 * 404 Not Found 응답 객체 (채용 공고 없음), 500 Internal Server Error 응답 객체 (서버 오류)
 */

// 지원하기 API (POST /applications)
router.post('/', authenticateJWT, async (req, res) => {
    const { jobId, resume } = req.body;

    if (!jobId) {
        return res.status(400).json({
            status: 'error',
            message: '채용 공고 ID가 필요합니다.',
        });
    }

    try {
        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({
                status: 'error',
                message: '해당 채용 공고를 찾을 수 없습니다.',
            });
        }

        // 이미 지원한 기록이 있는지 확인
        const existingApplication = await Application.findOne({
            where: { userId: req.user.id, jobId },
        });

        if (existingApplication) {
            // 기존 지원 상태가 '지원 취소'라면 상태만 '지원 완료'로 변경
            if (existingApplication.status === '지원 취소') {
                existingApplication.status = '지원 완료';
                await existingApplication.save();

                return res.status(200).json({
                    status: 'success',
                    data: existingApplication,
                });
            } else {
                // 이미 지원한 상태라면 오류 메시지 반환
                return res.status(400).json({
                    status: 'error',
                    message: '이미 해당 채용 공고에 지원하셨습니다.',
                });
            }
        }

        // 새로운 지원서 생성
        const application = await Application.create({
            userId: req.user.id,
            jobId,
            resume,
            status: '지원 완료', // 초기 상태
        });

        res.status(201).json({
            status: 'success',
            data: application,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: '지원 중 오류가 발생했습니다.',
        });
    }
});

/**
 * @swagger
 * /applications:
 *   get:
 *     summary: "지원 내역 조회"
 *     description: "사용자의 지원 내역을 조회하는 API"
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: "지원 상태 필터"
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: integer
 *         description: "채용 공고 ID 필터"
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: "사용자 ID 필터 (회사 사용자만 조회 가능)"
 *     responses:
 *       200:
 *         description: "지원 내역 조회 성공"
 *       500:
 *         description: "서버 오류"
 */

/**
 * 사용자의 지원 내역을 조회하는 API
 * 
 * @param {Object} req - Express 요청 객체, `status`, `jobId`, `userId`를 포함한 쿼리 파라미터
 * @param {Object} res - Express 응답 객체, 조회된 지원 내역 반환
 * 
 * @throws {Error} 지원 내역을 조회 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체 (지원 내역), 500 Internal Server Error 응답 객체 (서버 오류)
 */

// 지원 내역 조회 API (GET /applications)
router.get('/', authenticateJWT, async (req, res) => {
    const { status, jobId, userId } = req.query;
    const isCompany = req.user.role === 'company'; // 회사 사용자 여부 확인

    try {
        const filter = {};
        if (status) filter.status = status;
        if (jobId) filter.jobId = jobId;

        // 회사 사용자는 특정 사용자의 지원 목록도 조회 가능
        if (userId && isCompany) {
            filter.userId = userId;
        } else if (!isCompany) {
            // 일반 사용자는 자신의 지원 목록만 조회 가능
            filter.userId = req.user.id;
        }

        const applications = await Application.findAll({
            where: filter,
            include: [
                {
                    model: Job,
                    as: 'job',
                    attributes: ['title', 'company'], // 필요한 필드만 가져오기
                },
                ...(isCompany
                    ? [
                          {
                              model: User,
                              as: 'user', // 회사 사용자의 경우 지원자 정보 포함
                              attributes: ['name', 'email'], // 필요한 필드만 가져오기
                          },
                      ]
                    : []), // 일반 사용자는 User 정보 제외
            ],
            attributes: { exclude: ['id'] }, // Application의 id 필드 숨김
            order: [['createdAt', 'DESC']], // 날짜별로 정렬
        });

        // `resume`이 null이면 "미등록"으로 처리
        const processedApplications = applications.map(application => {
            const app = application.toJSON(); // Sequelize 객체를 JSON으로 변환
            app.resume = app.resume || "미등록"; // resume이 null이면 "미등록"으로 설정
            return app;
        });

        res.status(200).json({
            status: 'success',
            data: processedApplications,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: '지원 목록을 조회하는 중 오류가 발생했습니다.',
        });
    }
});

/**
 * @swagger
 * /applications/{id}:
 *   delete:
 *     summary: "지원 취소"
 *     description: "사용자가 자신의 지원을 취소하는 API"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "지원 ID"
 *     responses:
 *       200:
 *         description: "지원 취소 성공"
 *       403:
 *         description: "권한이 없음"
 *       404:
 *         description: "지원 내역을 찾을 수 없음"
 *       500:
 *         description: "서버 오류"
 */

/**
 * 사용자가 자신의 지원 내역을 취소하는 API
 * 
 * @param {Object} req - Express 요청 객체, `id` 파라미터 포함
 * @param {Object} res - Express 응답 객체, 지원 취소 상태 반환
 * 
 * @throws {Error} 지원 내역 취소 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체 (지원 취소 성공), 403 Forbidden 응답 객체 (권한 없음), 
 * 404 Not Found 응답 객체 (지원 내역 없음), 500 Internal Server Error 응답 객체 (서버 오류)
 */

// 지원 취소 API (DELETE /applications/:id)
router.delete('/:id', authenticateJWT, async (req, res) => {
    const jobId = req.params.id;

    try {
        const application = await Application.findOne({
            where: {
                jobId,
                userId: req.user.id, // 본인의 지원 내역만 조회
            },
        });

        if (!application) {
            return res.status(404).json({
                status: 'error',
                message: '해당 지원 내역을 찾을 수 없습니다.',
            });
        }

        console.log('Logged-in user ID:', req.user.id);
        console.log('Application user ID:', application.userId);

        if (application.userId !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                message: '해당 지원 내역을 취소 할 권한이 없습니다.',
            });
        }

        application.status = '지원 취소';
        await application.save();

        res.status(200).json({
            status: 'success',
            message: '지원이 성공적으로 취소되었습니다.',
            data: application, // 업데이트된 내역 반환
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: '지원 취소 중 오류가 발생했습니다.',
        });
    }
});

/**
 * @swagger
 * /applications/job/{jobId}/summary:
 *   get:
 *     summary: "지원 현황 집계"
 *     description: "특정 채용 공고에 대한 지원 현황을 집계하여 반환하는 API. 회사 사용자 또는 관리자만 접근 가능."
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "채용 공고 ID"
 *     responses:
 *       200:
 *         description: "지원 현황 집계 성공"
 *       403:
 *         description: "권한이 없음"
 *       500:
 *         description: "서버 오류"
 */

/**
 * 특정 채용 공고에 대한 지원 현황을 집계하여 반환하는 API
 * 
 * @param {Object} req - Express 요청 객체, `jobId` 파라미터 포함
 * @param {Object} res - Express 응답 객체, 지원 현황 집계 데이터 반환
 * 
 * @throws {Error} 지원 현황 집계 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체 (지원 현황), 403 Forbidden 응답 객체 (권한 없음), 
 * 500 Internal Server Error 응답 객체 (서버 오류)
 */

// 지원 현황 집계 API (GET /applications/job/:jobId/summary)
router.get('/job/:jobId/summary', authenticateJWT, authorizeRoles(['companyuser', 'admin']), async (req, res) => {
    const { jobId } = req.params;
    const { role } = req.user;  // JWT에서 userId와 role을 가져옵니다.

    try {        
        // 'companyuser' 역할인 경우, 해당 회사의 job만 조회하도록 제한
        if (role === 'companyuser' || role === 'admin') {
            // jobId에 해당하는 job 정보를 가져옵니다
            const job = await Job.findByPk(jobId);

            // 해당 jobId가 존재하지 않으면 에러 응답
            if (!job) {
                return res.status(403).json({
                    status: 'error',
                    message: '해당 공고에 대한 접근 권한이 없습니다.',
                });
            }

            // job 테이블에서 company 칼럼을 가져옵니다.
            const companyName = job.company;

            // 지원 현황 집계: jobId에 대한 지원자 수 및 각 상태별 지원자 수
            const applicationSummary = await Application.findAll({
                attributes: [
                    'status',  // 상태별로 집계하기 위해 'status' 기준으로 그룹화
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],  // 지원자 수 집계
                ],
                where: {
                    jobId,
                },
                group: ['status'],  // status별로 그룹화
                raw: true,
            });

            // 결과 반환: 회사명도 포함하여 반환
            res.status(200).json({
                status: 'success',
                companyName: companyName,  // 회사명 추가
                data: applicationSummary.map(entry => ({
                    status: entry.status,
                    count: entry['count'],  // 'count' 값에 정확히 접근
                })),
            });
        } else {
            return res.status(403).json({
                status: 'error',
                message: '권한이 없습니다.',
            });
        }
    } catch (error) {
        console.error('Error fetching application summary:', error);
        res.status(500).json({
            status: 'error',
            message: '지원 현황을 조회하는 중 오류가 발생했습니다.',
        });
    }
});



module.exports = router;
