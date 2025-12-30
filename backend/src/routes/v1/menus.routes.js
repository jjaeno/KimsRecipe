// v1 메뉴 단건 조회 라우트 정의. 메뉴 상세 정보 제공.

const express = require('express');
const controller = require('../../controllers/menus.controller');

const router = express.Router();

// 메뉴 단건 조회(Detail 화면)
router.get('/:storeMenuId', controller.getMenuDetail);

module.exports = router;
