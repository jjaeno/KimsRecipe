// Responsibility: API 응답 공통 타입을 정의한다. 모든 v1 API가 success/message/data 구조를 사용한다는 계약을 타입으로 표현한다.

/**
 * v1 API 공통 응답 래퍼
 * @template T 응답 data 필드 타입
 */
export type ApiResponse<T> = {
  success: boolean;
  code?: string;
  message: string;
  data?: T;
};
