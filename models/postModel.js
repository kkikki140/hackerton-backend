const pool = require('./db');

const validCategories = ['free', 'promotion_personal', 'promotion_official', 'news', 'hot'];

const PostModel = {
  // 게시글 생성
  create: async ({
    author_name = '익명',
    title,
    content,
    category = 'free',
    image_url = null,
    location = null,
    allow_comments = true,
    tags = []
  }) => {
    const postCategory = validCategories.includes(category) ? category : 'free';
    const result = await pool.query(
      `INSERT INTO posts(author_name, title, content, category, image_url, location, allow_comments, tags)
       VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [author_name, title, content, postCategory, image_url, location, allow_comments, tags]
    );
    return result.rows[0];
  },

  // 게시글 전체 조회 (페이징, 검색, 정렬)
  findAll: async ({ category, page = 1, limit = 10, search, sort = 'desc' }) => {
    const offset = (page - 1) * limit;
    let baseQuery = 'SELECT * FROM posts WHERE is_deleted = FALSE';
    let params = [];
    const conditions = [];

    if (category && validCategories.includes(category) && category !== 'hot') {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`title ILIKE $${params.length}`);
    }
    if (conditions.length) baseQuery += ' AND ' + conditions.join(' AND ');

    if (category === 'hot') {
      baseQuery = 'SELECT * FROM posts WHERE is_deleted = FALSE ORDER BY likes DESC, views DESC LIMIT $1 OFFSET $2';
      params = [limit, offset];
    } else {
      params.push(limit, offset);
      baseQuery += ` ORDER BY created_at ${sort.toLowerCase() === 'asc' ? 'ASC' : 'DESC'} LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }

    const result = await pool.query(baseQuery, params);
    return result.rows;
  },

  // 특정 게시글 조회
  findById: async (id) => {
    const result = await pool.query('SELECT * FROM posts WHERE id=$1 AND is_deleted = FALSE', [id]);
    return result.rows[0];
  },

  // 게시글 수정
  update: async ({
    id,
    title,
    content,
    category = 'free',
    image_url = null,
    location = null,
    allow_comments = true,
    tags = []
  }) => {
    const postCategory = validCategories.includes(category) ? category : 'free';

    // 필드 및 값 배열 구성
    let fields = ['title', 'content', 'category', 'location', 'allow_comments', 'tags', 'updated_at'];
    let values = [title, content, postCategory, location, allow_comments, tags, new Date()];

    if (image_url) {
      fields.splice(3, 0, 'image_url'); // image_url 위치 추가
      values.splice(3, 0, image_url);
    }

    values.push(id); // WHERE id=$n
    const setQuery = fields.map((f, i) => `${f}=$${i + 1}`).join(', ');

    const result = await pool.query(`UPDATE posts SET ${setQuery} WHERE id=$${values.length} AND is_deleted = FALSE RETURNING *`, values);
    return result.rows[0];
  },

  // 게시글 삭제
  delete: async (id) => {
    const result = await pool.query('UPDATE posts SET is_deleted = TRUE WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
  }
};

module.exports = PostModel;