// models/postModel.js
const pool = require('./db');

// 유효한 카테고리
const validCategories = ['free', 'question', 'promotion', 'news', 'hot'];

const PostModel = {
  // 새 글 작성
  create: async ({ author_name = '익명', title, content, category = 'free', image_url = null }) => {
    const postCategory = validCategories.includes(category) ? category : 'free';
    const result = await pool.query(
      `INSERT INTO posts(author_name, title, content, category, image_url) 
       VALUES($1, $2, $3, $4, $5) RETURNING *`,
      [author_name, title, content, postCategory, image_url]
    );
    return result.rows[0];
  },

  // 글 목록 조회 (카테고리별 + 페이지네이션 + 검색 + 정렬)
  findAll: async ({ category, page = 1, limit = 10, search, sort = 'desc' }) => {
    const offset = (page - 1) * limit;
    let baseQuery;
    let params = [];

    if (category === 'hot') {
      baseQuery = 'SELECT * FROM posts ORDER BY likes DESC, views DESC LIMIT $1 OFFSET $2';
      params = [limit, offset];
    } else {
      baseQuery = 'SELECT * FROM posts';
      const conditions = [];

      if (category && validCategories.includes(category)) {
        params.push(category);
        conditions.push(`category = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`title ILIKE $${params.length}`);
      }
      if (conditions.length) {
        baseQuery += ' WHERE ' + conditions.join(' AND ');
      }
      params.push(limit, offset);
      baseQuery += ` ORDER BY created_at ${sort.toLowerCase() === 'asc' ? 'ASC' : 'DESC'} LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }

    const result = await pool.query(baseQuery, params);
    return result.rows;
  },

  // 글 상세 조회
  findById: async (id) => {
    const result = await pool.query('SELECT * FROM posts WHERE id=$1', [id]);
    return result.rows[0];
  },

  // 글 수정
  update: async ({ id, title, content, category = 'free', image_url = null }) => {
    const postCategory = validCategories.includes(category) ? category : 'free';
    let result;

    if (image_url) {
      result = await pool.query(
        `UPDATE posts 
         SET title=$1, content=$2, category=$3, image_url=$4, updated_at=NOW() 
         WHERE id=$5 RETURNING *`,
        [title, content, postCategory, image_url, id]
      );
    } else {
      result = await pool.query(
        `UPDATE posts 
         SET title=$1, content=$2, category=$3, updated_at=NOW() 
         WHERE id=$4 RETURNING *`,
        [title, content, postCategory, id]
      );
    }

    return result.rows[0];
  },

  // 글 삭제
  delete: async (id) => {
    const result = await pool.query('DELETE FROM posts WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
  }
};

module.exports = PostModel;