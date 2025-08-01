const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = 

router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Server is alive!' });
});

/* status = 400: 클라이언트 입력 문제, 409: 중복 충돌, 500: 서버 오류 */
/*----회원가입 api----*/
router.post('/signUp', async (req, res) => {
  const { username, name, password, confirmPassword, phone } = req.body;
  try {
    //필수 입력 검증
    if (!username || !name || !password || !confirmPassword) {
      return res.status(400).json({success: false, message: '모든 항목을 입력해주세요.'});
    }
    //비밀번호 확인
    if (password !== confirmPassword) {
      return res.status(400).json({success: false, message: '비밀번호가 일치하지 않습니다.'});
    }
    //비밀번호 해시(2^10=1024번 반복 연산함)
    const hashedPassword = await bcrypt.hash(password, 10);
    //DB에 신규 사용자 저장
    const [result] = await db.query(
      'INSERT INTO users (username, name, password, phone) VALUES (?, ?, ?, ?)',
      [username, name, hashedPassword, phone || null]
    );
    //DB INSERT 성공 여부 확인
    if (result.affectedRows === 0) {
      console.error('DB에 신규 사용자 저장 실패', result);
      return res.status(500).json({success: false, message: '회원가입에 실패했습니다.(db 오류)'});
    }
    console.log('db에 사용자 저장 성공: ', result);

    return res.status(201).json({
      success: true,
      message: '회원가입 성공',
      userId: result.insertId,
    });
  } catch (err) {
    console.error('회원가입 에러: ', err);
    return res.status(500).json({message: '회원가입에 실패했습니다.(서버 오류)'})
  }
});

/*----아이디 중복 확인 api----*/
router.get('/check-username', async(req,res) => {
  const username = (req.query.username || '').trim();

  try {
    if (!username) {
      return res.status(400).json({available: false, message: '아이디를 입력해주세요.'});
    }

    const [existingUser] = await db.query('SELECT userId FROM users WHERE username = ?', [username]);
    if(existingUser.length > 0) {
      return res.status(200).json({available: false, message: '이미 사용 중인 아이디입니다.'});
    }

    return res.status(200).json({available: true, message: '사용 가능한 아이디입니다.'});
  } catch (err) {
    console.error('중복 확인 에러: ', err);
    return res.status(500).json({available: false, message: '서버 오류로 중복을 확인할 수 없습니다.'});
  }
});

/*----로그인 api----*/
router.post('/login', async(req, res) => {
    const {username, password} = req.body;

    try {
        if(!username || !password) {
            return res.status(400).json({success: false, message: '아이디 또는 비밀번호를 입력해주세요.'});
        }
        //db에서 사용자 조회
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username.trim()]);
        const user = rows[0];
        if (!user) {
            return res.status(401).json({success: false, message: '존재하지 않는 아이디입니다.'});
        }
        //비밀번호 검증
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({success: false, message: '비밀번호가 일치하지 않습니다.'});
        }
        //JWT 토큰 발급
        const token = jwt.sign(
            {userId: user.userId, username: user.username}, //payload
            JWT_SECRET, //key
            {expiresIn: '3h'}
        );
        console.log('로그인한 사용자 아이디/이름/전화번호: ', user.username, user.name, user.phone);
        console.log(`${user.username}의 토큰: `, token);
        return res.status(200).json({
            success: true,
            message: '로그인 성공',
            token, //프론트로 보낼 토큰
            userId: user.userId,
            username: user.username,
            name: user.name,
            phone: user.phone,
        });
    } catch (err) {
        console.error('로그인 에러: ', err);
        return res.status(500).json({success: false, message: '서버 오류로 로그인을 실패하였습니다.'});
    }
});

/*----jwt 인증 미들웨어----*/
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader & authHeader.split(' ')[1]; //"Bearer <token>"

    if (!token) {
        return res.status(401).json({success: false, message: '토큰이 없습니다.'});
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; //다음 라우터에서 req.user를 유저 정보로 바로 사용 가능
        next();
    } catch (err) {
        console.error('JWT 인증 오류: ', err);
        return res.status(403).json({success: false, message: '유효하지 않은 토큰입니다.'});
    }
};
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // req.user에서 JWT payload 접근 가능
    const { userId, username } = req.user;

    return res.status(200).json({
      success: true,
      message: '사용자 프로필 정보',
      data: { userId, username },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
});
module.exports = router;