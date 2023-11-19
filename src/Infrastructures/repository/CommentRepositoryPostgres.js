const AddedComment = require('../../Domains/comments/entities/AddedComment');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const InvariantError = require('../../Commons/exceptions/InvariantError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const CommentRepository = require('../../Domains/comments/CommentRepository');

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(addComment) {
    const { threadId, owner, content } = addComment;
    const id = `comment-${this._idGenerator()}`;
    const date = new Date().toISOString();

    const query = {
      text: 'INSERT INTO comments VALUES($1, $2, $3, $4, $5, $6) RETURNING id, content, owner',
      values: [id, threadId, owner, content, 'false', date],
    };

    const result = await this._pool.query(query);

    return new AddedComment({ ...result.rows[0] });
  }

  async getCommentById(commentId) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('comment tidak ditemukan');
    }
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: `SELECT comments.id, users.username, comments.date, comments.content, comments.is_delete 
      FROM comments 
      LEFT JOIN users ON users.id = comments.owner 
      WHERE comments.thread_id = $1
      ORDER BY comments.date ASC`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async verifyCommentAccess(commentId, owner) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('comment tidak ditemukan');
    }

    const comment = result.rows[0];

    if (comment.owner !== owner) {
      throw new AuthorizationError('owner tidak berhak untuk mengakses comment');
    }
  }

  async deleteComment(commentId) {
    const query = {
      text: 'UPDATE comments SET is_delete = \'true\' WHERE id = $1 RETURNING id',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('comment tidak ditemukan');
    }
  }

  async verifyCommentLikes(userId, commentId) {
    const query = {
      text: 'SELECT id FROM user_comment_likes WHERE user_id = $1 AND comment_id = $2',
      values: [userId, commentId],
    };

    const result = await this._pool.query(query);

    return result.rows.length;
  }

  async addLikeToComment(userId, commentId) {
    const likeData = await this.verifyCommentLikes(userId, commentId);

    if (likeData) {
      throw new InvariantError('Gagal menambahkan like ke comment');
    }

    const id = `like-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO user_comment_likes VALUES($1, $2, $3)',
      values: [id, userId, commentId],
    };

    await this._pool.query(query);
  }

  async deleteLikeFromComment(userId, commentId) {
    const query = {
      text: 'DELETE FROM user_comment_likes WHERE user_id = $1 AND comment_id = $2 RETURNING id',
      values: [userId, commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menghapus like dari comment');
    }
  }

  async getCommentLikes(commentId) {
    const query = {
      text: `SELECT * FROM users
      LEFT JOIN user_comment_likes ON user_comment_likes.user_id = users.id
      WHERE user_comment_likes.comment_id = $1`,
      values: [commentId],
    };

    const result = await this._pool.query(query);

    return result.rows.length;
  }
}

module.exports = CommentRepositoryPostgres;
