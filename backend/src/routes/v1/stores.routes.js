//매장/메뉴 조회 라우트 정의 . 매장 목록 및 메뉴 정보 제공.

const express = require('express');
const controller = require('../../controllers/stores.controller');

const router = express.Router();

// 매장 목록 조회
router.get('/', controller.getStores);

module.exports = router;
