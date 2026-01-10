const express = require('express');
const authService = require('../services/auth.service');
const { success } = require('../utils/response');

const router = express.Router();

// Frontend endpoint examples (base: /api/v1):
// POST /api/v1/auth/signup
// POST /api/v1/auth/login
// GET  /api/v1/auth/check-username?username=sample
// POST /api/v1/auth/check-username

async function signUp(req, res, next) {
  try {
    const result = await authService.signUp(req.body);
    return success(res, result, '회원가입에 성공했습니다.', 'OK', 201);
  } catch (err) {
    return next(err);
  }
}

async function checkUsername(req, res, next) {
  try {
    const username = req.body?.username ?? req.query?.username;
    const result = await authService.checkUsername(username);
    return success(res, result, result.available ? '사용 가능한 아이디입니다.' : '이미 사용 중입니다.');
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return success(res, result, '로그인에 성공했습니다.');
  } catch (err) {
    return next(err);
  }
}

router.post('/signup', signUp);
router.post('/login', login);
router.get('/check-username', checkUsername);
router.post('/check-username', checkUsername);

module.exports = router;


