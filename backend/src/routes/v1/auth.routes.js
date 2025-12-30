// v1 인증 라우트 정의. 회원가입, 로그인, 아이디 중복 확인 등.

const express = require('express');
const controller = require('../../controllers/auth.controller');

const router = express.Router();

// 회원가입
router.post('/signup', controller.signUp);

// 로그인
router.post('/login', controller.login);

// 아이디 중복 확인
router.get('/check-username', controller.checkUsername);

// 아이디 중복 확인 (POST 버전)
router.post('/check-username', controller.checkUsername);

module.exports = router;
