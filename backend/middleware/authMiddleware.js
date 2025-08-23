// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  try {
    // Node는 헤더 키를 소문자로 넣어줌
    const auth = req.headers['authorization'] || req.headers['Authorization'];

    // Bearer 형식 체크
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '토큰이 없습니다.' });
    }

    const token = auth.slice(7).trim(); // 'Bearer ' 제거
    if (!JWT_SECRET) {
      // .env가 안 올라온 경우
      return res.status(500).json({ success: false, message: '서버 설정 오류(JWT_SECRET 없음)' });
    }

    const decoded = jwt.verify(token, JWT_SECRET); // 검증
    // userId로 서명했어도 id로 표준화
    const id = decoded.id ?? decoded.userId ?? decoded.sub;
    if (!id) return res.status(401).json({ success:false, message:'토큰에 사용자 id가 없습니다.' });
    req.user = {...decoded, id: Number(id)}; //사인할 때 userId라는 변수명으로 사인해도 req.user.id로 사용 가능함
    return next();
  } catch (err) {
    console.error('JWT 인증 오류:', err?.message || err);
    return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }
}

module.exports = { authMiddleware };
