const express = require('express');
const router = express.Router();
const pool = require('../models/db'); // pg Pool

// 마이페이지 조회 (userId만 URL로 전달)
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // 1️⃣ 프로필 조회
    const profileResult = await pool.query(
      `SELECT id, nickname, bio, avatar_url,
              name, email, location, joinDate, birth, gender, phone
       FROM users
       WHERE id = $1`,
      [userId]
    );
    const profile = profileResult.rows[0];
    if (!profile) return res.status(404).json({ error: "사용자 프로필 없음" });

    // 2️⃣ 내가 쓴 게시글 조회 + 댓글 수 + 좋아요 수
    const postsResult = await pool.query(
      `SELECT p.id, p.title, p.content, p.created_at, p.category,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments,
              (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes
       FROM posts p
       WHERE p.author_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );
    const posts = postsResult.rows;

    // 3️⃣ 내가 쓴 댓글
    const commentsResult = await pool.query(
      'SELECT id, post_id, content, created_at FROM comments WHERE author_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const comments = commentsResult.rows;

    // 4️⃣ 내가 좋아요한 게시물 목록
    const likedPostsResult = await pool.query(
      `SELECT p.id, p.title, p.category, u.nickname AS author, p.created_at
       FROM likes l
       JOIN posts p ON l.post_id = p.id
       JOIN users u ON p.author_id = u.id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC`,
      [userId]
    );
    const likedPosts = likedPostsResult.rows;

    // 5️⃣ 관심 이벤트
    const eventsResult = await pool.query(
      'SELECT e.id, e.event_name, e.event_date, e.location FROM interested_events e WHERE e.user_id = $1 ORDER BY e.event_date',
      [userId]
    );
    const interested_events = eventsResult.rows;

    // 6️⃣ 내가 받은 좋아요 수
    const likesReceivedResult = await pool.query(
      `SELECT COUNT(*) AS likes_received
       FROM likes l
       JOIN posts p ON l.post_id = p.id
       WHERE p.author_id = $1`,
      [userId]
    );
    const likes_received = likesReceivedResult.rows[0].likes_received;

    // 7️⃣ 통계
    const statistics = {
      posts: posts.length,
      comments: comments.length,
      likes_received: Number(likes_received),
      interested_events: interested_events.length
    };

    // 최종 응답
    res.json({
      profile: {
        ...profile,
        avatar: profile.avatar_url || '/placeholder.svg?height=80&width=80'
      },
      posts,
      comments,
      likedPosts,
      interested_events,
      statistics
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 프로필 수정
router.put('/:userId/profile', async (req, res) => {
  const { userId } = req.params;
  const { nickname, bio, avatar_url, name, email, location, birth, gender, phone } = req.body;

  if (!nickname || !bio || !avatar_url) {
    return res.status(400).json({ error: "nickname, bio, avatar_url 필수" });
  }

  try {
    await pool.query(
      `UPDATE users
       SET nickname=$1, bio=$2, avatar_url=$3,
           name=$4, email=$5, location=$6, birth=$7, gender=$8, phone=$9
       WHERE id=$10`,
      [nickname, bio, avatar_url, name, email, location, birth, gender, phone, userId]
    );

    const profileResult = await pool.query(
      `SELECT id, nickname, bio, avatar_url, name, email, location, joinDate, birth, gender, phone
       FROM users WHERE id=$1`,
      [userId]
    );
    const profile = profileResult.rows[0];

    res.json({
      ...profile,
      avatar: profile.avatar_url || '/placeholder.svg?height=80&width=80'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;