const express = require('express');
const wishlistService = require('../services/wishlist.service');
const { success } = require('../utils/response');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET    /api/v1/wishlists
// POST   /api/v1/wishlists
// DELETE /api/v1/wishlists/:storeMenuId

async function getWishlist(req, res, next) {
  try {
    const result = await wishlistService.getWishlist(req.user.id);
    return success(res, result, '찜 목록 조회 성공');
  } catch (err) {
    return next(err);
  }
}

async function addWishlistItem(req, res, next) {
  try {
    const { storeMenuId } = req.body;
    const result = await wishlistService.addWishlistItem({ userId: req.user.id, storeMenuId });
    return success(res, result, '찜 추가 완료');
  } catch (err) {
    return next(err);
  }
}

async function removeWishlistItem(req, res, next) {
  try {
    const { storeMenuId } = req.params;
    const result = await wishlistService.removeWishlistItem({ userId: req.user.id, storeMenuId });
    return success(res, result, '찜 해제 완료');
  } catch (err) {
    return next(err);
  }
}

router.get('/', auth, getWishlist);
router.post('/', auth, addWishlistItem);
router.delete('/:storeMenuId', auth, removeWishlistItem);

module.exports = router;
