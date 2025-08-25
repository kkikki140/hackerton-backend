const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001;

// PostgreSQL 연결
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 개발용 CORS: 모든 도메인 허용
app.use(cors());

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 라우터 연결
app.use('/posts', require('./routes/posts'));
app.use('/comments', require('./routes/comments'));
app.use('/likes', require('./routes/likes'));
app.use('/faq', require('./routes/faq'));
app.use('/mypage', require('./routes/mypage'));
// ... 나머지 라우터 생략

// 서버 실행
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = { app, pool };