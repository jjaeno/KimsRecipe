// Responsibility: DB 커넥션 풀 주입 지점. 기존 backend/db.js(mysql2/promise createPool)를 래핑하여 새 레이어드 코드가 동일한 풀을 재사용하도록 한다. 여기서는 커넥션 생성/해제 로직만 노출하며 비즈니스 로직은 포함하지 않는다.

// Service/Repository 레이어가 가져다 쓰는 단일 진입점이다. pool 자체만 export하며 트랜잭션 경계 설정은 Service가 관리한다.
const pool = require('../../db');

module.exports = pool;
