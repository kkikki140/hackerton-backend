# 게시판 API 명세서 (Frontend용)

## 📌 기본 정보
- **Base URL:** `http://localhost:3001/posts`
- **Content-Type:** `application/json`
- **인증:** 없음 (로그인 없이 사용 가능)

---

## 1️⃣ 게시글 작성 (Create)

- **URL:** `/`
- **Method:** `POST`
- **설명:** 새 글 작성 (이미지 첨부 가능)
- **Request Body:**
```json
{
  "author_name": "익명",
  "title": "글 제목",
  "content": "글 내용",
  "category": "free", 
  "image": "(파일, multipart/form-data)"
}
```
- **category 옵션**: free, question, promotion, news, hot

- **HOT 게시판 글은 직접 작성 불가**


- **Response:**
```
{
  "id": 1,
  "author_name": "익명",
  "title": "글 제목",
  "content": "글 내용",
  "category": "free",
  "image_url": "/uploads/123456.jpg",
  "created_at": "2025-08-21T03:00:00.000Z",
  "updated_at": "2025-08-21T03:00:00.000Z"
}
```
## 2️⃣ 게시글 목록 조회 (Read)
- **URL:**: /

- **Method**: GET

- **Query Parameters**:

- `category`: `free` | `question` | `promotion` | `news` | `hot`
- `page`: 1
- `limit`: 10
- `search`: 검색어
- `sort`: `asc` | `desc`

- **설명**: `category = hot` → 좋아요, 조회수 기준 상위 글 조회

- **다른 카테고리** → 페이지네이션, 검색, 정렬 가능


- **Response**:
```
  {
    "id": 1,
    "author_name": "익명",
    "title": "글 제목",
    "content": "글 내용",
    "category": "free",
    "image_url": "/uploads/123456.jpg",
    "likes": 5,
    "views": 12,
    "created_at": "2025-08-21T03:00:00.000Z",
    "updated_at": "2025-08-21T03:00:00.000Z"
  }
```


## 3️⃣ 게시글 수정 (Update)
- **URL**: /:`id`

- **Method**: `PUT`

- **설명**: 글 수정 (이미지 포함 가능)


- **Request Body**:
```
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "category": "question",
  "image": "(파일, multipart/form-data)"
}
```
- **주의**: HOT 게시판 글은 수정 불가


- **Response**:
```
{
  "id": 1,
  "author_name": "익명",
  "title": "수정된 제목",
  "content": "수정된 내용",
  "category": "question",
  "image_url": "/uploads/789012.jpg",
  "created_at": "2025-08-21T03:00:00.000Z",
  "updated_at": "2025-08-21T03:30:00.000Z"
}
```
## 4️⃣ 게시글 삭제 (Delete)
- **URL: /:`id`

- **Method: `DELETE`

- **설명**: 글 삭제


- **Response**:
```
{
  "message": "글이 삭제되었습니다."
}
```
## 5️⃣ 좋아요 기능
- **좋아요 추가**: `POST` /`likes`

- **좋아요 삭제**: `DELETE` /`likes`

- **특정 글 좋아요 수 조회**: `GET` /`likes?post_id=1`

- **특정 사용자가 좋아요했는지 확인**: `GET` /`likes/check?post_id=1&author_name=익명`

## 6️⃣ 이미지 업로드
- **업로드 방식**: `multipart/form-data`

- **Field Name**: `image`

- **Response**: `/uploads/파일명`

## 7️⃣ HOT 게시판
- **조회 방식**: `GET` /`posts?category=hot&page=1&limit=10`

- **정렬 기준**: 좋아요 수(likes), 조회수(views) 기준 내림차순

- **주의**: 직접 작성/수정 불가, 페이지네이션 가능

## ✅ 참고 사항
- 모든 API는 로그인 없이 사용 가능

- 조회수, 좋아요 정보는 자동 업데이트

- 게시판 기능은 free, question, promotion, news, hot 총 5개 카테고리로 분류
