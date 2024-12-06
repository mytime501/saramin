# Job Application API

이 프로젝트는 구직자의 지원 현황을 관리하고, 회사의 구인 공고 및 지원자의 인터뷰 진행 상황을 관리하는 API 시스템입니다. 이 시스템은 구직자가 지원한 직업에 대한 정보를 확인하고, 회사는 지원자의 인터뷰와 지원 상태를 관리할 수 있습니다.

## 기술 스택

- **Node.js**: 서버 사이드 자바스크립트 실행 환경
- **Express.js**: Node.js를 위한 웹 애플리케이션 프레임워크
- **Sequelize**: Node.js에서 사용되는 ORM(Object-Relational Mapping) 라이브러리
- **MySQL**: 관계형 데이터베이스 관리 시스템
- **JWT**: JSON Web Token을 이용한 인증
- **Swagger**: API 문서화 도구

## 기능

1. **직업 공고 관리 (CompanyUser)**
   - 구인 공고를 등록하고, 해당 공고에 대한 지원자를 관리합니다.

2. **지원자 관리**
   - 구직자는 구인 공고에 지원하고, 지원 상태를 관리할 수 있습니다.
   - 구직자는 인터뷰를 예약하고 피드백을 제공할 수 있습니다.

3. **관리자 (Admin)**
   - 모든 구인 공고, 지원자 및 인터뷰 정보를 관리합니다.
   - 회사와 구직자의 데이터를 종합적으로 확인할 수 있습니다.

4. **직업 지원 현황 집계**
   - 각 구인 공고에 대한 지원 현황을 집계하여, 지원자 수 및 지원 상태별 분포를 확인할 수 있습니다.

5. **사용자 인증 및 회원 관리**
   - 회원 가입, 로그인, 회원 정보 수정 및 탈퇴 기능을 제공합니다.
   - JWT를 활용한 인증 및 토큰 갱신 기능을 지원합니다.

6. **부가 기능**
   - 북마크 추가 및 조회 기능
   - 리뷰 작성 및 조회 기능

## 설치 방법

1. **프로젝트 클론**
   ```bash
   git clone https://github.com/mytime501/saramin.git
   cd saramin
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   `.env` 파일을 생성하고 아래와 같은 항목을 설정합니다.
   ```env
   DB_USERNAME=""
   DB_PASSWORD=""
   DB_DATABASE=""
   DB_HOST=""
   DB_DIALECT=""
   JWT_SECRET=""
   DB_PORT=""
   PORT=""
   ```

4. **데이터베이스 마이그레이션**
   데이터베이스 스키마를 생성하고 초기 데이터를 마이그레이션합니다.
   ```bash
   npx sequelize-cli db:migrate
   ```

5. **서버 실행**
   ```bash
   node server.js
   ```

   서버가 실행되면 `http://localhost:<PORT>`에서 API를 사용할 수 있습니다.

## API 문서화

이 프로젝트에서는 Swagger를 사용하여 API를 문서화하고 있습니다. Swagger UI는 `/api-docs` 경로에서 확인할 수 있습니다.

## API 엔드포인트

### 1. **회원 관리**
- `POST /auth/register`: 회원 가입
- `POST /auth/login`: 로그인 후 JWT 발급
- `POST /auth/refresh`: 토큰 갱신
- `PUT /auth/profile`: 회원 정보 수정
- `DELETE /auth/profile`: 회원 탈퇴

### 2. **구인 공고 관리**
- `GET /jobs`: 구인 공고 목록 조회
- `GET /jobs/:id`: 특정 공고 상세 조회
- `POST /jobs`: 새로운 공고 등록 (CompanyUser 권한 필요)
- `PUT /jobs/:id`: 기존 공고 수정 (CompanyUser 권한 필요)
- `DELETE /jobs/:id`: 공고 삭제 (CompanyUser 권한 필요)

### 3. **지원 관리**
- `POST /applications`: 구직자가 공고에 지원
- `GET /applications`: 지원 내역 조회
- `GET /applications/job/:jobId/summary`: 특정 공고의 지원 현황 집계
- `DELETE /applications/:id`: 지원 취소

### 4. **인터뷰 관리**
- `GET /interviews`: 인터뷰 목록 조회
- `POST /interviews`: 인터뷰 생성
- `PUT /interviews/:id`: 인터뷰 수정 (피드백 업데이트)
- `DELETE /interviews/:id`: 인터뷰 삭제

### 5. **리뷰 관리**
- `GET /jobreviews/:jobId`: 특정 공고에 대한 리뷰 조회
- `POST /jobreviews`: 리뷰 작성

### 6. **부가 기능**
- `POST /bookmarks`: 북마크 추가
- `GET /bookmarks`: 북마크 목록 조회

### 7. **회사 관리**
- `GET /companies`: 회사 목록 조회
- `GET /companies/:id`: 특정 회사 상세 조회
- `POST /companies`: 새로운 회사 등록

## 권한 관리

- **JobSeeker**: 구직자는 구인 공고에 지원하고 인터뷰를 예약하거나 리뷰를 작성할 수 있습니다.
- **CompanyUser**: 회사 사용자는 공고를 등록 및 관리하며 지원자와 인터뷰를 관리할 수 있습니다.
- **Admin**: 모든 데이터를 조회 및 관리할 수 있는 최상위 권한을 가집니다.

## 예외 처리 및 오류 메시지

- 인증 실패: "유효한 토큰이 필요합니다."
- 권한 부족: "권한이 없습니다."
- 잘못된 요청: "요청 데이터가 올바르지 않습니다."
- 서버 오류: "서버에서 오류가 발생했습니다."

## 기여

이 프로젝트에 기여하고 싶으신가요? 다음 단계를 따라 주세요:

1. 프로젝트를 포크합니다.
2. 새 브랜치를 만듭니다 (`git checkout -b feature-name`).
3. 변경 사항을 커밋합니다 (`git commit -am 'Add new feature'`).
4. 푸시합니다 (`git push origin feature-name`).
5. Pull Request를 생성합니다.

## 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다.


## 추가 API 엔드포인트

### 지원 관련 API

- **지원하기**
  - `POST /applications`
  - 요청 데이터:  
    ```json
    {
      "jobId": "<지원할 공고 ID>",
      "resume": "<이력서 정보>"
    }
    ```

- **지원 내역 조회**
  - `GET /applications`
  - 요청 쿼리:  
    ```json
    {
      "status": "<지원 상태>",
      "jobId": "<공고 ID>",
      "userId": "<사용자 ID>"
    }
    ```

- **지원 취소**
  - `DELETE /applications/:id`
  - 요청 파라미터:  
    - `id`: 지원 ID

- **지원 현황 집계**
  - `GET /applications/job/:jobId/summary`
  - 요청 파라미터:  
    - `jobId`: 공고 ID

---

### 인증 및 사용자 관리 API

- **로그인**
  - `POST /auth/login`
  - 요청 데이터:  
    ```json
    {
      "email": "<사용자 이메일>",
      "password": "<사용자 비밀번호>"
    }
    ```

- **토큰 갱신**
  - `POST /auth/refresh`
  - 요청 데이터:  
    ```json
    {
      "refreshToken": "<리프레시 토큰>"
    }
    ```

- **회원 정보 수정**
  - `PUT /auth/profile`
  - 요청 데이터:  
    ```json
    {
      "email": "<새 이메일>",
      "name": "<새 이름>",
      "password": "<새 비밀번호>"
    }
    ```

- **회원가입**
  - `POST /auth/register`
  - 요청 데이터:  
    ```json
    {
      "email": "<사용자 이메일>",
      "password": "<사용자 비밀번호>",
      "name": "<사용자 이름>"
    }
    ```

- **회원탈퇴**
  - `DELETE /auth/profile`

---

### 북마크 API

- **북마크 추가/제거**
  - `POST /bookmarks`
  - 요청 데이터:  
    ```json
    {
      "jobId": "<북마크할 공고 ID>"
    }
    ```

- **북마크 목록 조회**
  - `GET /bookmarks`
  - 요청 쿼리:  
    ```json
    {
      "page": 1,
      "limit": 10
    }
    ```

---

### 회사 관리 API

- **회사 목록 조회**
  - `GET /companies`

- **특정 회사 조회**
  - `GET /companies/:id`
  - 요청 파라미터:  
    - `id`: 회사 ID

- **새로운 회사 추가**
  - `POST /companies`
  - 요청 데이터:  
    ```json
    {
      "name": "<회사 이름>",
      "location": "<회사 위치>",
      "industry": "<산업 분야>",
      "website": "<웹사이트 URL>",
      "contact_number": "<연락처>"
    }
    ```

---

### 인터뷰 관리 API

- **인터뷰 목록 조회**
  - `GET /interviews`

- **인터뷰 생성**
  - `POST /interviews`
  - 요청 데이터:  
    ```json
    {
      "applicationId": "<지원 ID>",
      "interview_date": "<인터뷰 날짜>",
      "feedback": "<피드백>"
    }
    ```

- **인터뷰 수정**
  - `PUT /interviews/:applicationId`
  - 요청 데이터:  
    ```json
    {
      "feedback": "<수정할 피드백>"
    }
    ```

- **인터뷰 삭제**
  - `DELETE /interviews/:id`
  - 요청 파라미터:  
    - `id`: 인터뷰 ID

---

### 리뷰 API

- **특정 공고의 리뷰 조회**
  - `GET /jobreviews/:jobId`
  - 요청 파라미터:  
    - `jobId`: 공고 ID

- **새로운 리뷰 작성**
  - `POST /jobreviews`
  - 요청 데이터:  
    ```json
    {
      "jobId": "<공고 ID>",
      "review_text": "<리뷰 내용>",
      "rating": "<평점 (1-5)>"
    }
    ```

---

### 채용 공고 API

- **채용 공고 목록 조회**
  - `GET /jobs`
  - 요청 쿼리:  
    ```json
    {
      "page": 1,
      "sortBy": "id",
      "sortOrder": "ASC",
      "location": "<지역>",
      "experience": "<경력>",
      "salary": "<연봉>",
      "techStack": "<기술 스택>",
      "keyword": "<검색 키워드>",
      "company": "<회사 이름>",
      "position": "<직책>"
    }
    ```

- **채용 공고 상세 조회**
  - `GET /jobs/:id`
  - 요청 파라미터:  
    - `id`: 공고 ID

- **채용 공고 수정**
  - `PUT /jobs/:id`
  - 요청 데이터:  
    ```json
    {
      "title": "<공고 제목>",
      "company": "<회사 이름>",
      "location": "<회사 위치>",
      "experience": "<경력>",
      "education": "<학력>",
      "employmentType": "<고용 형태>",
      "deadline": "<마감 기한>",
      "techStack": "<기술 스택>",
      "salary": "<연봉>",
      "description": "<공고 설명>",
      "link": "<공고 URL>"
    }
    ```

- **채용 공고 삭제**
  - `DELETE /jobs/:id`
  - 요청 파라미터:  
    - `id`: 공고 ID

- **채용 공고 등록**
  - `POST /jobs`
  - 요청 데이터:  
    ```json
    {
      "title": "<공고 제목>",
      "company": "<회사 이름>",
      "location": "<회사 위치>",
      "experience": "<경력>",
      "education": "<학력>",
      "employmentType": "<고용 형태>",
      "deadline": "<마감 기한>",
      "techStack": "<기술 스택>",
      "salary": "<연봉>",
      "description": "<공고 설명>",
      "link": "<공고 URL>"
    }
    ```