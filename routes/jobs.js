const express = require('express');
const router = express.Router();
const { Job } = require('../models');
const { authenticateJWT } = require('../middleware/authenticateJWT');
const { Op } = require('sequelize');
const Joi = require('joi');  // Joi를 사용하여 데이터 검증

/**
 * 빈 문자열을 '미기제'로 변환하는 함수
 * @param {string|null} field - 변환할 문자열 또는 null 값
 * @returns {string} 빈 문자열 또는 null인 경우 '미기제', 그렇지 않으면 원래 값 반환
 */

// 빈 문자열을 '미기제'로 변환하는 함수
const handleEmptyField = (field) => (field === "" || field === null) ? "미기제" : field;

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: 채용 공고 목록 조회
 *     description: 다양한 필터 옵션을 통해 채용 공고 목록을 조회합니다.
 *     parameters:
 *       - name: page
 *         in: query
 *         description: "페이지 번호 (기본값: 1)"
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: sortBy
 *         in: query
 *         description: "정렬 기준 (기본값: 'id')"
 *         required: false
 *         schema:
 *           type: string
 *           default: 'id'
 *       - name: sortOrder
 *         in: query
 *         description: "정렬 순서 (기본값: 'ASC')"
 *         required: false
 *         schema:
 *           type: string
 *           default: 'ASC'
 *       - name: location
 *         in: query
 *         description: 채용 공고의 위치
 *         required: false
 *         schema:
 *           type: string
 *       - name: experience
 *         in: query
 *         description: 요구되는 경력
 *         required: false
 *         schema:
 *           type: string
 *       - name: salary
 *         in: query
 *         description: 급여
 *         required: false
 *         schema:
 *           type: string
 *       - name: techStack
 *         in: query
 *         description: 기술 스택
 *         required: false
 *         schema:
 *           type: string
 *       - name: keyword
 *         in: query
 *         description: 키워드로 공고를 검색
 *         required: false
 *         schema:
 *           type: string
 *       - name: company
 *         in: query
 *         description: 회사 이름
 *         required: false
 *         schema:
 *           type: string
 *       - name: position
 *         in: query
 *         description: 채용 직책
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 채용 공고 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: '프론트엔드 개발자 모집'
 *                       company:
 *                         type: string
 *                         example: 'ABC Corp'
 *                       deadline:
 *                         type: string
 *                         example: '2024-12-31'
 *                 totalItems:
 *                   type: integer
 *                   example: 100
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: 서버 오류
 */
/**
 * 채용 공고 목록 조회 API (GET /jobs)
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Object} - 채용 공고 목록과 관련 데이터
 * @throws {Error} - 데이터 조회 및 필터링 중 오류 발생 시 예외 처리
 */

// 채용 공고 목록 조회 API (GET /jobs)
router.get('/', authenticateJWT, async (req, res) => {
    const {
        page = 1, // 기본 페이지는 1
        sortBy = 'id', // 기본 정렬 기준
        sortOrder = 'ASC', // 기본 정렬 순서
        location,
        experience,
        salary,
        techStack,
        keyword,
        company,
        position,
    } = req.query;

    const pageSize = 20; // 페이지 크기

    try {
        const filters = {};

        // 필터링 조건 추가
        if (location) filters.location = { [Op.like]: `%${location}%` };
        if (experience) filters.experience = { [Op.like]: experience };
        if (salary) filters.salary = { [Op.like]: `%${salary}%` };
        if (techStack) filters.techStack = { [Op.like]: `%${techStack}%` };

        // 검색 기능
        if (keyword) {
            filters[Op.or] = [
                { title: { [Op.like]: `%${keyword}%` } },
                { description: { [Op.like]: `%${keyword}%` } },
            ];
        }
        if (company) filters.company = { [Op.like]: `%${company}%` };
        if (position) filters.description = { [Op.like]: `%${position}%` };

        // 데이터 조회 (필드 제한: id, title, company, deadline)
        const { count, rows } = await Job.findAndCountAll({
            where: filters,
            order: [[sortBy, sortOrder]],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            attributes: ['id', 'title', 'company', 'deadline'], // 필요한 필드만 조회
        });

        // 빈 문자열을 '미기제'로 변환
        const modifiedRows = rows.map(job => ({
            id: job.id,
            title: handleEmptyField(job.title),
            company: handleEmptyField(job.company),
            deadline: handleEmptyField(job.deadline),
        }));

        // 결과 반환
        res.status(200).json({
            status: 'success',
            data: modifiedRows,
            totalItems: count,
            totalPages: Math.ceil(count / pageSize),
            currentPage: parseInt(page),
        });
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({
            status: 'error',
            message: '채용 공고 검색/필터링 중 오류가 발생했습니다.',
        });
    }
});

/**
 * 채용 공고 상세 조회 API (GET /jobs/:id)
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Object} - 채용 공고의 상세 정보와 관련 공고
 * @throws {Error} - 공고 조회 또는 관련 공고 조회 중 오류 발생 시 예외 처리
 */
/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: 특정 채용 공고 상세 조회
 *     description: 특정 채용 공고의 상세 정보와 관련된 다른 공고들을 조회합니다.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 채용 공고 ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 공고 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     job:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         title:
 *                           type: string
 *                           example: '프론트엔드 개발자 모집'
 *                         company:
 *                           type: string
 *                           example: 'ABC Corp'
 *                         description:
 *                           type: string
 *                           example: 'React, JavaScript, Node.js 등'
 *                         location:
 *                           type: string
 *                           example: '서울'
 *                         salary:
 *                           type: string
 *                           example: '5,000,000원'
 *                     relatedJobs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 2
 *                           title:
 *                             type: string
 *                             example: '백엔드 개발자 모집'
 *                           company:
 *                             type: string
 *                             example: 'XYZ Corp'
 *                           deadline:
 *                             type: string
 *                             example: '2024-12-30'
 *       404:
 *         description: 해당 공고를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

// 채용 공고 상세 조회 API (GET /jobs/:id)
router.get('/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;

    try {
        // 공고 상세 정보 조회 (전체 데이터 조회)
        const job = await Job.findByPk(id);

        if (!job) {
            return res.status(404).json({
                status: 'error',
                message: '해당 공고를 찾을 수 없습니다.',
            });
        }

        // 조회수 증가
        await job.increment('views');

        // 관련 공고 추천: 동일 회사 또는 유사 기술 스택
        const relatedJobs = await Job.findAll({
            where: {
                [Op.or]: [
                    { company: job.company },
                    { techStack: { [Op.like]: `%${job.techStack}%` } },
                ],
                id: { [Op.ne]: job.id }, // 현재 공고 제외
            },
            limit: 5, // 추천 공고 최대 5개
        });

        // 빈 문자열을 '미기제'로 변환
        const modifiedJob = {
            ...job.dataValues,
            title: handleEmptyField(job.title),
            company: handleEmptyField(job.company),
            description: handleEmptyField(job.description),
            location: handleEmptyField(job.location),
            experience: handleEmptyField(job.experience),
            salary: handleEmptyField(job.salary),
            techStack: handleEmptyField(job.techStack),
        };

        const modifiedRelatedJobs = relatedJobs.map(relatedJob => ({
            id: relatedJob.id,
            title: handleEmptyField(relatedJob.title),
            company: handleEmptyField(relatedJob.company),
            deadline: handleEmptyField(relatedJob.deadline),
        }));

        // 상세 정보 및 추천 공고 반환
        res.status(200).json({
            status: 'success',
            data: {
                job: modifiedJob,           // 전체 채용 공고 데이터 (빈 문자열 '미기제' 처리)
                relatedJobs: modifiedRelatedJobs,   // 관련 채용 공고 (빈 문자열 '미기제' 처리)
            },
        });
    } catch (error) {
        console.error('Detail Error:', error);
        res.status(500).json({
            status: 'error',
            message: '공고 상세 조회 중 오류가 발생했습니다.',
        });
    }
});

/**
 * 채용 공고 수정 API (PUT /jobs/:id)
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Object} - 수정된 채용 공고 데이터
 * @throws {Error} - 공고 수정 중 오류 발생 시 예외 처리
 */
/**
 * @swagger
 * /jobs/{id}:
 *   put:
 *     summary: 채용 공고 수정
 *     description: 채용 공고의 정보를 수정합니다.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 수정할 채용 공고의 ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "프론트엔드 개발자 모집"
 *               company:
 *                 type: string
 *                 example: "ABC Corp"
 *               location:
 *                 type: string
 *                 example: "서울"
 *               experience:
 *                 type: string
 *                 example: "5년 이상"
 *               education:
 *                 type: string
 *                 example: "학사 이상"
 *               employmentType:
 *                 type: string
 *                 enum: ["full-time", "part-time", "contract", "internship"]
 *                 example: "full-time"
 *               deadline:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *               techStack:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["React", "Node.js"]
 *               salary:
 *                 type: number
 *                 example: 5000000
 *               description:
 *                 type: string
 *                 example: "React, JavaScript, Node.js 등 프론트엔드 개발자 모집"
 *               link:
 *                 type: string
 *                 example: "https://example.com/job-posting"
 *     responses:
 *       200:
 *         description: 채용 공고 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 채용 공고가 성공적으로 수정되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: "프론트엔드 개발자 모집"
 *                     company:
 *                       type: string
 *                       example: "ABC Corp"
 *                     location:
 *                       type: string
 *                       example: "서울"
 *       400:
 *         description: 잘못된 입력값
 *       404:
 *         description: 해당 채용 공고를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

// 채용 공고 수정 API (PUT /jobs/:id)
router.put('/:id', authenticateJWT, async (req, res) => {
    const jobId = req.params.id;
    const { title, company, location, experience, education, employmentType, deadline, techStack, salary, description, link } = req.body;

    // Joi를 이용한 입력 데이터 검증 스키마 정의
    const schema = Joi.object({
        title: Joi.string().min(3).max(255).required().messages({
            'string.empty': '제목은 필수 항목입니다.',
            'string.min': '제목은 최소 3자 이상이어야 합니다.',
            'string.max': '제목은 최대 255자까지 가능합니다.',
        }),
        company: Joi.string().min(3).max(255).required().messages({
            'string.empty': '회사명은 필수 항목입니다.',
            'string.min': '회사명은 최소 3자 이상이어야 합니다.',
            'string.max': '회사명은 최대 255자까지 가능합니다.',
        }),
        location: Joi.string().min(3).max(255).required().messages({
            'string.empty': '위치는 필수 항목입니다.',
            'string.min': '위치는 최소 3자 이상이어야 합니다.',
            'string.max': '위치는 최대 255자까지 가능합니다.',
        }),
        experience: Joi.string().min(3).max(255).required().messages({
            'string.empty': '경력 요구사항은 필수 항목입니다.',
            'string.min': '경력 요구사항은 최소 3자 이상이어야 합니다.',
            'string.max': '경력 요구사항은 최대 255자까지 가능합니다.',
        }),
        education: Joi.string().min(3).max(255).required().messages({
            'string.empty': '학력 요구사항은 필수 항목입니다.',
            'string.min': '학력 요구사항은 최소 3자 이상이어야 합니다.',
            'string.max': '학력 요구사항은 최대 255자까지 가능합니다.',
        }),
        employmentType: Joi.string().valid('full-time', 'part-time', 'contract', 'internship').required().messages({
            'any.only': '고용 형태는 full-time, part-time, contract, internship 중 하나여야 합니다.',
            'string.empty': '고용 형태는 필수 항목입니다.',
        }),
        deadline: Joi.date().iso().required().messages({
            'string.empty': '마감일은 필수 항목입니다.',
            'date.format': '마감일은 유효한 날짜 형식이어야 합니다.',
        }),
        techStack: Joi.array().items(Joi.string()).min(1).required().messages({
            'array.min': '기술 스택은 최소 1개 이상이어야 합니다.',
            'array.base': '기술 스택은 배열 형태여야 합니다.',
            'string.base': '기술 스택의 각 항목은 문자열이어야 합니다.',
        }),
        salary: Joi.number().positive().required().messages({
            'number.base': '급여는 숫자여야 합니다.',
            'number.positive': '급여는 양수여야 합니다.',
            'any.required': '급여는 필수 항목입니다.',
        }),
        description: Joi.string().min(10).required().messages({
            'string.empty': '설명은 필수 항목입니다.',
            'string.min': '설명은 최소 10자 이상이어야 합니다.',
        }),
        link: Joi.string().uri().required().messages({
            'string.uri': '링크는 유효한 URL 형식이어야 합니다.',
            'string.empty': '링크는 필수 항목입니다.',
        }),
    });

    // 입력값 검증
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((err) => err.message);
        return res.status(400).json({
            status: 'error',
            message: errorMessages.join(', '),
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

        // 채용 공고 수정
        job.title = title;
        job.company = company;
        job.location = location;
        job.experience = experience;
        job.education = education;
        job.employmentType = employmentType;
        job.deadline = deadline;
        job.techStack = techStack;
        job.description = description;
        job.salary = salary;
        job.link = link;
        job.views = 0;
        await job.save();

        res.status(200).json({
            status: 'success',
            message: '채용 공고가 성공적으로 수정되었습니다.',
            data: job,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: '채용 공고 수정 중 오류가 발생했습니다.',
        });
    }
});

/**
 * 채용 공고 삭제 API (DELETE /jobs/:id)
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Object} - 삭제된 공고에 대한 응답
 * @throws {Error} - 공고 삭제 중 오류 발생 시 예외 처리
 */
/**
 * @swagger
 * /jobs/{id}:
 *   delete:
 *     summary: 채용 공고 삭제
 *     description: 채용 공고를 삭제합니다.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 삭제할 채용 공고의 ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 채용 공고 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 채용 공고가 성공적으로 삭제되었습니다.
 *       404:
 *         description: 해당 채용 공고를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

// 채용 공고 삭제 API (DELETE /jobs/:id)
router.delete('/:id', authenticateJWT, async (req, res) => {
    const jobId = req.params.id;

    try {
        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({
                status: 'error',
                message: '해당 채용 공고를 찾을 수 없습니다.',
            });
        }

        // 채용 공고 삭제
        await job.destroy();

        res.status(200).json({
            status: 'success',
            message: '채용 공고가 성공적으로 삭제되었습니다.',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: '채용 공고 삭제 중 오류가 발생했습니다.',
        });
    }
});

/**
 * 채용 공고 등록 API (POST /jobs)
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Object} - 생성된 채용 공고의 데이터
 * @throws {Error} - 공고 등록 중 오류 발생 시 예외 처리
 */
/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: 채용 공고 등록
 *     description: 새로운 채용 공고를 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "프론트엔드 개발자 모집"
 *               company:
 *                 type: string
 *                 example: "ABC Corp"
 *               location:
 *                 type: string
 *                 example: "서울"
 *               experience:
 *                 type: string
 *                 example: "5년 이상"
 *               education:
 *                 type: string
 *                 example: "학사 이상"
 *               employmentType:
 *                 type: string
 *                 enum: ["full-time", "part-time", "contract", "internship"]
 *                 example: "full-time"
 *               deadline:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *               techStack:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["React", "Node.js"]
 *               salary:
 *                 type: number
 *                 example: 5000000
 *               description:
 *                 type: string
 *                 example: "React, JavaScript, Node.js 등 프론트엔드 개발자 모집"
 *               link:
 *                 type: string
 *                 example: "https://example.com/job-posting"
 *     responses:
 *       201:
 *         description: 채용 공고 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: "프론트엔드 개발자 모집"
 *                     company:
 *                       type: string
 *                       example: "ABC Corp"
 *                     location:
 *                       type: string
 *                       example: "서울"
 *       400:
 *         description: 잘못된 입력값
 *       500:
 *         description: 서버 오류
 */

// 채용 공고 등록 API (POST /jobs)
router.post('/', authenticateJWT, async (req, res) => {
    const { title, company, location, experience, education, employmentType, deadline, techStack, salary, description, link } = req.body;

    // Joi를 이용한 입력 데이터 검증 스키마 정의
    const schema = Joi.object({
        title: Joi.string().min(3).max(255).required().messages({
            'string.empty': '제목은 필수 항목입니다.',
            'string.min': '제목은 최소 3자 이상이어야 합니다.',
            'string.max': '제목은 최대 255자까지 가능합니다.',
        }),
        company: Joi.string().min(3).max(255).required().messages({
            'string.empty': '회사명은 필수 항목입니다.',
            'string.min': '회사명은 최소 3자 이상이어야 합니다.',
            'string.max': '회사명은 최대 255자까지 가능합니다.',
        }),
        location: Joi.string().min(3).max(255).required().messages({
            'string.empty': '위치는 필수 항목입니다.',
            'string.min': '위치는 최소 3자 이상이어야 합니다.',
            'string.max': '위치는 최대 255자까지 가능합니다.',
        }),
        experience: Joi.string().min(3).max(255).required().messages({
            'string.empty': '경력 요구사항은 필수 항목입니다.',
            'string.min': '경력 요구사항은 최소 3자 이상이어야 합니다.',
            'string.max': '경력 요구사항은 최대 255자까지 가능합니다.',
        }),
        education: Joi.string().min(3).max(255).required().messages({
            'string.empty': '학력 요구사항은 필수 항목입니다.',
            'string.min': '학력 요구사항은 최소 3자 이상이어야 합니다.',
            'string.max': '학력 요구사항은 최대 255자까지 가능합니다.',
        }),
        employmentType: Joi.string().valid('full-time', 'part-time', 'contract', 'internship').required().messages({
            'any.only': '고용 형태는 full-time, part-time, contract, internship 중 하나여야 합니다.',
            'string.empty': '고용 형태는 필수 항목입니다.',
        }),
        deadline: Joi.date().iso().required().messages({
            'string.empty': '마감일은 필수 항목입니다.',
            'date.format': '마감일은 유효한 날짜 형식이어야 합니다.',
        }),
        techStack: Joi.array().items(Joi.string()).min(1).required().messages({
            'array.min': '기술 스택은 최소 1개 이상이어야 합니다.',
            'array.base': '기술 스택은 배열 형태여야 합니다.',
            'string.base': '기술 스택의 각 항목은 문자열이어야 합니다.',
        }),
        salary: Joi.number().positive().required().messages({
            'number.base': '급여는 숫자여야 합니다.',
            'number.positive': '급여는 양수여야 합니다.',
            'any.required': '급여는 필수 항목입니다.',
        }),
        description: Joi.string().min(10).required().messages({
            'string.empty': '설명은 필수 항목입니다.',
            'string.min': '설명은 최소 10자 이상이어야 합니다.',
        }),
        link: Joi.string().uri().required().messages({
            'string.uri': '링크는 유효한 URL 형식이어야 합니다.',
            'string.empty': '링크는 필수 항목입니다.',
        }),
    });

    // 입력값 검증
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((err) => err.message);
        return res.status(400).json({
            status: 'error',
            message: errorMessages.join(', '),
        });
    }

    try {
        const newJob = await Job.create({
            title,
            company,
            location,
            experience,
            education,
            employmentType,
            deadline,
            techStack,
            salary,
            description,
            link,
            views: 0,
            userId: req.user.id, // 공고를 등록한 사용자 ID
        });

        res.status(201).json({
            status: 'success',
            data: newJob,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: '채용 공고 등록 중 오류가 발생했습니다.',
        });
    }
});

module.exports = router;
