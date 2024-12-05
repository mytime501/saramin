const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// 1. 인증 미들웨어 (Authentication Middleware)
function authenticateJWT(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({
            status: 'error',
            message: '토큰이 필요합니다.'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // 만약 토큰이 만료된 경우
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: 'error',
                    message: '액세스 토큰이 만료되었습니다. 리프레시 토큰을 사용해 새로운 액세스 토큰을 발급받으세요.',
                    instructions: '리프레시 토큰을 /refresh API로 전송하여 새로운 액세스 토큰을 받으세요.'
                });
            }

            return res.status(403).json({
                status: 'error',
                message: '유효하지 않은 토큰입니다.'
            });
        }

        // 토큰이 유효하면 user 정보를 req.user에 추가
        req.user = user;

        next();
    });
}

// 2. 권한 검사 미들웨어 (Authorization Middleware)
function authorizeRoles(roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: '권한이 없습니다.'
            });
        }
        next();
    };
}

// 3. 입력 데이터 및 파라미터 검증 (Input Validation Middleware)
const validateUserInput = [
    body('email')
        .isEmail()
        .withMessage('유효한 이메일을 입력하세요.'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('비밀번호는 최소 6자 이상이어야 합니다.')
];

function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: '입력 값이 유효하지 않습니다.',
            errors: errors.array()
        });
    }
    next();
}

module.exports = { authenticateJWT, authorizeRoles, validateUserInput, handleValidationErrors };