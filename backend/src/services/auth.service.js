// Responsibility: 인증/회원가입 도메인 규칙을 처리한다. 입력 검증, 중복 체크, 비밀번호 해시, 토큰 발급 등 비즈니스 로직을 담당하며, SQL을 직접 실행한다.
// Service가 하지 않는 일: HTTP 응답/상태 결정, 라우팅, express next 호출. 에러는 AppError로 던져 Controller/글로벌 핸들러가 처리한다.

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { AppError, errorFactory } = require('../utils/errors');

const JWT_SECRET = process.env.JWT_SECRET;

async function signUp(payload) {
  // 필수값 검증 -> 비밀번호 일치 검사 -> 중복 아이디 검사 -> 해시 후 insert
  const { username, name, password, confirmPassword, phone } = payload;
  if (!username || !name || !password || !confirmPassword) {
    throw errorFactory.badRequest('모든 필수 항목을 입력해주세요.');
  }
  if (password !== confirmPassword) {
    throw errorFactory.badRequest('비밀번호가 일치하지 않습니다.');
  }

  const existing = await findUserByUsername(username);
  if (existing) {
    throw errorFactory.conflict('이미 사용 중인 아이디입니다.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = await createUser({ username, name, password: hashedPassword, phone });
  return { userId };
}

async function checkUsername(username) {
  // 아이디 입력 여부 검사 후 중복 여부 반환
  if (!username) {
    throw errorFactory.badRequest('아이디를 입력해주세요.');
  }
  const existing = await findUserByUsername(username.trim());
  return { available: !existing };
}

async function login({ username, password }) {
  // 아이디/비번 검증 -> 사용자 조회 -> 비번 비교 -> JWT 발급
  if (!username || !password) {
    throw errorFactory.badRequest('아이디와 비밀번호를 입력해주세요.');
  }
  const user = await findUserByUsername(username.trim());
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', '존재하지 않는 아이디입니다.');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError(401, 'UNAUTHORIZED', '비밀번호가 올바르지 않습니다.');
  }
  if (!JWT_SECRET) {
    throw errorFactory.internal('서버 환경설정(JWT_SECRET)이 누락되었습니다.');
  }
  const token = jwt.sign(
    { userId: user.userId, username: user.username, name: user.name, phone: user.phone },
    JWT_SECRET,
    { expiresIn: '3h' },
  );
  return {
    token,
    userId: user.userId,
    username: user.username,
    name: user.name,
    phone: user.phone,
  };
}


const withConn = (conn) => conn || pool;

async function findUserByUsername(username, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  return rows[0] || null;
}

async function createUser({ username, name, password, phone }, conn) {
  const executor = withConn(conn);
  const [result] = await executor.query(
    'INSERT INTO users (username, name, password, phone) VALUES (?, ?, ?, ?)',
    [username, name, password, phone || null],
  );
  return result.insertId;
}

module.exports = {
  signUp,
  checkUsername,
  login,
};


