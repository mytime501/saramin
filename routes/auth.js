const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // 모델 import (예: Sequelize 모델)
const { authenticateJWT, validateUserInput, handleValidationErrors } = require('../middleware/authenticateJWT'); // 미들웨어 import
const router = express.Router(); // router 객체 생성

/**
 * @swagger
 * /login:
 *   post:
 *     summary: "로그인"
 *     description: "이메일과 비밀번호를 사용하여 로그인하고 JWT 토큰을 발급합니다."
 *     requestBody:
 *       description: "사용자 로그인 정보"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: "사용자의 이메일"
 *               password:
 *                 type: string
 *                 description: "사용자의 비밀번호"
 *     responses:
 *       200:
 *         description: "로그인 성공 및 JWT 토큰 발급"
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
 *                     accessToken:
 *                       type: string
 *                       description: "액세스 토큰"
 *                     refreshToken:
 *                       type: string
 *                       description: "리프레시 토큰"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *       400:
 *         description: "잘못된 비밀번호"
 *       404:
 *         description: "사용자가 존재하지 않음"
 *       500:
 *         description: "서버 오류"
 */

/**
 * 사용자가 이메일과 비밀번호로 로그인하고, 액세스 토큰과 리프레시 토큰을 발급받는 API
 * 
 * @param {Object} req - Express 요청 객체 (이메일, 비밀번호 포함)
 * @param {Object} res - Express 응답 객체 (액세스 토큰 및 리프레시 토큰 포함)
 * 
 * @throws {Error} 사용자 조회 또는 비밀번호 비교 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체 (로그인 성공), 400 Bad Request 응답 객체 (잘못된 비밀번호), 
 * 404 Not Found 응답 객체 (사용자 없음), 500 Internal Server Error 응답 객체 (서버 오류)
 */

// 로그인 API
router.post('/login', validateUserInput, handleValidationErrors, async (req, res) => {
    const { email, password } = req.body;

    try {
        // 사용자 조회
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: '이메일에 해당하는 사용자가 없습니다.'
            });
        }

        // 비밀번호 확인 (Base64로 암호화된 비밀번호 비교)
        const decodedPassword = Buffer.from(user.password, 'base64').toString('utf-8');
        if (decodedPassword !== password) {
            return res.status(400).json({
                status: 'error',
                message: '잘못된 비밀번호입니다.'
            });
        }

        // JWT 토큰 발급
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        // 로그인 이력 저장 (선택사항)
        // 예를 들어, 로그인 시점 기록 등을 저장할 수 있습니다.

        res.status(200).json({
            status: 'success',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: '로그인 중 오류가 발생했습니다.'
        });
    }
});

/**
 * @swagger
 * /refresh:
 *   post:
 *     summary: "리프레시 토큰을 이용한 액세스 토큰 갱신"
 *     description: "리프레시 토큰을 사용해 새로운 액세스 토큰을 발급받습니다."
 *     requestBody:
 *       description: "리프레시 토큰"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: "리프레시 토큰"
 *     responses:
 *       200:
 *         description: "새로운 액세스 토큰 발급"
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
 *                     accessToken:
 *                       type: string
 *                       description: "새로운 액세스 토큰"
 *       400:
 *         description: "리프레시 토큰이 제공되지 않음"
 *       403:
 *         description: "유효하지 않은 리프레시 토큰"
 *       500:
 *         description: "서버 오류"
 */

/**
 * 리프레시 토큰을 이용해 새로운 액세스 토큰을 발급받는 API
 * 
 * @param {Object} req - Express 요청 객체 (리프레시 토큰 포함)
 * @param {Object} res - Express 응답 객체 (새로운 액세스 토큰 포함)
 * 
 * @throws {Error} 리프레시 토큰 검증 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체 (새로운 액세스 토큰 발급), 400 Bad Request 응답 객체 (리프레시 토큰 누락), 
 * 403 Forbidden 응답 객체 (유효하지 않은 리프레시 토큰), 500 Internal Server Error 응답 객체 (서버 오류)
 */

// 토큰 갱신 API
router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            status: 'error',
            message: '리프레시 토큰이 필요합니다.'
        });
    }

    try {
        // refreshToken 검증
        jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    status: 'error',
                    message: '유효하지 않은 리프레시 토큰입니다.'
                });
            }

            // 새로운 액세스 토큰 발급
            const payload = {
                id: decoded.id,
                email: decoded.email,
                name: decoded.name
            };

            const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.status(200).json({
                status: 'success',
                data: {
                    accessToken: newAccessToken
                }
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: '토큰 갱신 중 오류가 발생했습니다.'
        });
    }
});

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: "회원 정보 수정"
 *     description: "인증된 사용자가 자신의 이메일, 이름, 비밀번호를 수정합니다."
 *     requestBody:
 *       description: "수정할 사용자 정보"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: "수정할 이메일"
 *               name:
 *                 type: string
 *                 description: "수정할 이름"
 *               password:
 *                 type: string
 *                 description: "수정할 비밀번호"
 *     responses:
 *       200:
 *         description: "회원 정보 수정 성공"
 *       400:
 *         description: "수정할 정보가 제공되지 않음"
 *       500:
 *         description: "서버 오류"
 */

/**
 * 인증된 사용자가 자신의 이메일, 이름, 비밀번호를 수정하는 API
 * 
 * @param {Object} req - Express 요청 객체 (수정할 이메일, 이름, 비밀번호 포함)
 * @param {Object} res - Express 응답 객체 (수정 성공 메시지 포함)
 * 
 * @throws {Error} 사용자 정보 수정 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체 (회원 정보 수정 성공), 400 Bad Request 응답 객체 (수정할 정보 미제공), 
 * 500 Internal Server Error 응답 객체 (서버 오류)
 */

// 회원 정보 수정 API
router.put('/profile', authenticateJWT, async (req, res) => {
    const { email, name, password } = req.body;
    const userId = req.user.id; // 인증된 사용자 ID (미들웨어에서 설정된)

    if (!email && !name && !password) {
        return res.status(400).json({
            status: 'error',
            message: '수정할 정보를 제공해 주세요.'
        });
    }

    try {
        // 비밀번호 변경 시 Base64로 암호화
        let updatedPassword = password;
        if (password) {
            updatedPassword = Buffer.from(password).toString('base64');
        }

        // DB에서 사용자 정보 업데이트
        const updatedUser = await User.update(
            {
                email,
                name,
                password: updatedPassword || undefined,
            },
            {
                where: {
                    id: userId,
                },
            });

        if (updatedUser[0] === 0) {
            return res.status(404).json({
                status: 'error',
                message: '사용자 정보를 수정할 수 없습니다.',
            });
        }

        res.status(200).json({
            status: 'success',
            message: '회원 정보가 성공적으로 수정되었습니다.',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: '회원 정보 수정 중 오류가 발생했습니다.',
        });
    }
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: "회원가입"
 *     description: "사용자가 이메일, 비밀번호, 이름을 입력하여 회원가입을 합니다."
 *     requestBody:
 *       description: "회원가입 정보"
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: "사용자의 이메일"
 *               password:
 *                 type: string
 *                 description: "사용자의 비밀번호"
 *               name:
 *                 type: string
 *                 description: "사용자의 이름"
 *     responses:
 *       201:
 *         description: "회원가입 성공"
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
 *                       type: integer
 *                       description: "사용자 ID"
 *                     email:
 *                       type: string
 *                       description: "사용자 이메일"
 *                     name:
 *                       type: string
 *                       description: "사용자 이름"
 *                     role:
 *                       type: string
 *                       description: "사용자 역할"
 *       400:
 *         description: "이메일, 비밀번호, 이름이 누락되었거나 중복 이메일"
 *       500:
 *         description: "서버 오류"
 */

/**
 * 사용자가 이메일, 비밀번호, 이름을 입력하여 회원가입을 하는 API
 * 
 * @param {Object} req - Express 요청 객체 (이메일, 비밀번호, 이름 포함)
 * @param {Object} res - Express 응답 객체 (회원가입 성공 데이터 포함)
 * 
 * @throws {Error} 이메일 중복 확인, 사용자 저장 중 발생한 오류
 * 
 * @returns {Object} 201 Created 응답 객체 (회원가입 성공), 400 Bad Request 응답 객체 (잘못된 입력), 
 * 500 Internal Server Error 응답 객체 (서버 오류)
 */

router.post('/register', validateUserInput, handleValidationErrors, async (req, res) => {
    const { email, password, name } = req.body;

    try {
        // 필수 항목 확인
        if (!email || !password || !name) {
            return res.status(400).json({
                status: 'error',
                message: '이메일, 비밀번호, 이름은 필수 항목입니다.'
            });
        }

        // 중복 이메일 체크
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: '이미 존재하는 이메일입니다.'
            });
        }

        // 비밀번호 암호화
        const hashedPassword = Buffer.from(password).toString('base64');

        // 사용자 정보 저장
        const user = await User.create({
            email,
            password: hashedPassword,
            name
        });

        res.status(201).json({
            status: 'success',
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: '회원가입 중 오류가 발생했습니다.'
        });
    }
});

/**
 * @swagger
 * /profile:
 *   delete:
 *     summary: "회원 탈퇴"
 *     description: "인증된 사용자가 자신의 계정을 삭제합니다."
 *     responses:
 *       200:
 *         description: "회원 탈퇴 성공"
 *       404:
 *         description: "사용자를 찾을 수 없거나 삭제할 수 없음"
 *       500:
 *         description: "서버 오류"
 */

/**
 * 인증된 사용자가 자신의 계정을 삭제하는 API
 * 
 * @param {Object} req - Express 요청 객체 (인증된 사용자 정보 포함)
 * @param {Object} res - Express 응답 객체 (탈퇴 성공 메시지 포함)
 * 
 * @throws {Error} 사용자 삭제 중 발생한 오류
 * 
 * @returns {Object} 200 OK 응답 객체 (회원 탈퇴 성공), 404 Not Found 응답 객체 (사용자 미존재 또는 삭제 실패), 
 * 500 Internal Server Error 응답 객체 (서버 오류)
 */
router.delete('/profile', authenticateJWT, async (req, res) => {
    const userId = req.user.id; // 인증된 사용자 ID (미들웨어에서 설정된)

    try {
        // 사용자 삭제
        const deletedUser = await User.destroy({
            where: {
                id: userId
            }
        });

        if (deletedUser === 0) {
            return res.status(404).json({
                status: 'error',
                message: '사용자를 찾을 수 없거나 삭제할 수 없습니다.'
            });
        }

        res.status(200).json({
            status: 'success',
            message: '회원 탈퇴가 완료되었습니다.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: '회원 탈퇴 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router; // router 내보내기
