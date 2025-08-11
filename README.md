#  KimsRecipe

> 다점포 반찬가게 주문/관리 애플리케이션  
> **React Native + Node.js + MySQL** 기반  
> 멀티 지점 메뉴 조회, 장바구니, 결제, 관리자 기능 지원

---

##  1. 프로젝트 개요
KimsRecipe는 여러 지점(호점)의 메뉴를 한 앱에서 관리·주문할 수 있는 반찬가게 주문 앱입니다.  
사용자는 지점을 선택하고 카테고리별로 메뉴를 확인하여 장바구니에 담아 주문할 수 있으며, 관리자는 관리자 페이지를 통해 지점/카테고리/메뉴를 추가·수정할 수 있습니다.

---

##  2. 기술 스택

### **Frontend**
- **React Native**: `0.80.1`
- **TypeScript**
- **React Navigation** (Stack + Bottom Tabs)
- 상태 관리: React Context API
- HTTP 통신: Fetch API
- 이미지 표시: Firebase Storage 이미지 URL 사용

### **Backend**
- **Node.js**: `20.14.0`
- **Express.js**
- **CORS**, **body-parser**
- **JWT** (로그인 세션 관리)
- 파일 업로드: `multer` (이미지는 Firebase Storage에 저장)
- API 응답: JSON 구조 (점포-카테고리-메뉴 계층)

### **Database**
- **MySQL**: `8.x`
- 데이터 모델:
  - `stores` (지점 정보)
  - `categories` (지점별 카테고리)
  - `items` (카테고리별 메뉴)
- 관계: stores (1) — (N) categories (1) — (N) items 
## 3. 데이터 구조
프론트엔드에서 사용하는 데이터 구조는 다음과 같습니다.
```ts
type Store = {
  storeId: string;
  storeName: string;
  categories: StoreCategory[];
};
type StoreCategory = {
  categoryId: string;
  categoryName: string;
  items: StoreItem[];
};
type StoreItem = {
  id: string;           // 전역 유니크 메뉴 ID
  name: string;
  description: string;
  price: number;
  image: string;        // Firebase Storage URL
  popularity: number;   // 인기순
};
```
전역 상태에서는 stores를 그대로 유지하면서, 모든 메뉴를 평탄화한 flatItems 배열을 추가로 관리하여 foodId 기반의 빠른 단일 조회를 지원합니다.

## 4. 프론트엔드 구조
```
frontend/
 ├─ src/
 │   ├─ components/        # 재사용 UI 컴포넌트
 │   ├─ context/           # 전역 상태 (StoreContext.tsx)
 │   ├─ navigation/        # Stack & Tab 네비게이션 설정
 │   ├─ screens/           # Home, Detail, Cart, Order 등
 │   ├─ services/          # API 호출 함수
 │   └─ types/             # 타입 정의
 ├─ android/
 ├─ ios/
 └─ package.json
```
- stores: 전체 지점/카테고리/메뉴 데이터
- selectedStoreId: 현재 선택된 지점
- searchText: 검색어
- flatItems: 평탄화된 메뉴 배열 (storeId, categoryId 포함) → foodId로 O(1) 조회 가능

## 5. 백엔드 구조
```
backend/
 ├─ routes/
 │   ├─ store.js       # 점포/카테고리/메뉴 조회 API
 │   ├─ auth.js        # 로그인/회원가입
 │   ├─ admin.js       # 관리자 전용 API
 │   └─ cart.js        # 장바구니/주문 API
 ├─ db/
 │   └─ pool.js        # MySQL 연결
 ├─ middleware/
 │   ├─ auth.js        # JWT 인증 미들웨어
 ├─ server.js          # Express 서버 엔트리
 └─ package.json
```
주요 API 예시:
- GET /api/stores/getAll: 전체 지점/카테고리/메뉴 계층 조회
- POST /api/cart: 장바구니 데이터 저장
- POST /api/items: 관리자 메뉴 추가
- POST /api/upload: 메뉴 이미지 업로드(Firebase Storage)

## 6. 실행 방법
**프론트엔드**
```bash
cd frontend
npm install
npm run android  # 또는 npm run ios
```
**백엔드**
```bash
cd backend
npm install
npm start
```
**데이터베이스**
- MySQL 8.x 설치 후 .env 파일에 DB 접속 정보 설정
- 초기 테이블 생성 스크립트 실행
