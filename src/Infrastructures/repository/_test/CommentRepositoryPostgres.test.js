/* eslint-disable no-undef */
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UserCommentLikesTableTestHelper = require('../../../../tests/UserCommentLikesTableTestHelper');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const InvariantError = require('../../../Commons/exceptions/InvariantError');
const AddComment = require('../../../Domains/comments/entities/AddComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const pool = require('../../database/postgres/pool');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist after adding a comment', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ title: 'testing', body: 'automated testing' });
      const addComment = new AddComment({
        threadId: 'thread-123',
        owner: 'user-123',
        content: 'automated testing',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await commentRepositoryPostgres.addComment(addComment);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comments).toHaveLength(1);
    });

    it('should return added content correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ title: 'testing', body: 'automated testing' });
      const addComment = new AddComment({
        threadId: 'thread-123',
        owner: 'user-123',
        content: 'automated testing',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(addComment);

      // Assert
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'automated testing',
        owner: 'user-123',
      }));
    });
  });

  describe('getCommentById function', () => {
    it('should throw NotFoundError when comment not found', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.getCommentById('comment-123')).rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when comment found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.getCommentById('comment-123')).resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('verifyCommentAccess function', () => {
    it('should throw NotFoundError when comment not found', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentAccess('comment-123', 'user-123')).rejects.toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when comment not owned by user', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentAccess('comment-123', 'user-456')).rejects.toThrowError(AuthorizationError);
    });

    it('should not throw AuthorizationError when comment owned by user', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentAccess('comment-123', 'user-123')).resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('deleteComment function', () => {
    it('should throw NotFoundError when comment not found', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.deleteComment('comment-456')).rejects.toThrowError(NotFoundError);
    });

    it('should change is_delete to true', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      await commentRepositoryPostgres.deleteComment('comment-123');
      const deletedComment = await CommentsTableTestHelper.findCommentById('comment-123');

      // Assert
      expect(deletedComment[0].is_delete).toStrictEqual(true);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return correct comments based on threadId', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'tester_2' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-456' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-789', threadId: 'thread-456', owner: 'user-456', content: 'testing testing',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      const threadComments123 = await commentRepositoryPostgres.getCommentsByThreadId('thread-123');
      const threadComments456 = await commentRepositoryPostgres.getCommentsByThreadId('thread-456');

      // Assert
      expect(threadComments123[0]).toStrictEqual({
        id: 'comment-123',
        username: 'tester',
        date: '2021-08-08T07:22:33.555Z',
        content: 'testing',
        is_delete: false,
      });
      expect(threadComments456[0]).toStrictEqual({
        id: 'comment-789',
        username: 'tester_2',
        date: '2021-08-08T07:22:33.555Z',
        content: 'testing testing',
        is_delete: false,
      });
    });
  });

  describe('verifyCommentLikes function', () => {
    it('should return 0 when comment is liked by user', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await UsersTableTestHelper.addUser({ id: 'user-456' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      await UserCommentLikesTableTestHelper.addUserCommentLike({});
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      const result = await commentRepositoryPostgres.verifyCommentLikes('user-456', 'comment-123');

      // Assert
      expect(result).toStrictEqual(0);
    });

    it('should return 1 when comment is liked by user', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      await UserCommentLikesTableTestHelper.addUserCommentLike({});
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      const result = await commentRepositoryPostgres.verifyCommentLikes('user-123', 'comment-123');

      // Assert
      expect(result).toStrictEqual(1);
    });
  });

  describe('addLikeToComment function', () => {
    it('should throw InvariantError when comment is already liked by user', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      await UserCommentLikesTableTestHelper.addUserCommentLike({});
      const fakeIdGenerator = () => '123'; // stub!
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(commentRepositoryPostgres.addLikeToComment('user-123', 'comment-123')).rejects.toThrowError(InvariantError);
    });

    it('should not throw InvariantError when comment is not liked by user', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      const fakeIdGenerator = () => '123'; // stub!
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(commentRepositoryPostgres.addLikeToComment('user-123', 'comment-123')).resolves.not.toThrowError(InvariantError);
    });
  });

  describe('deleteLikeFromComment function', () => {
    it('should throw InvariantError when userId or commentId does not exist', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.deleteLikeFromComment('user-123', 'comment-123')).rejects.toThrowError(InvariantError);
    });

    it('should not throw InvariantError when userId and commentId exist', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      await UserCommentLikesTableTestHelper.addUserCommentLike({});
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.deleteLikeFromComment('user-123', 'comment-123')).resolves.not.toThrowError(InvariantError);
    });
  });

  describe('getCommentLikes function', () => {
    it('should return the correct like count', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await UsersTableTestHelper.addUser({ id: 'user-456' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      await CommentsTableTestHelper.addComment({ id: 'comment-456' });
      await UserCommentLikesTableTestHelper.addUserCommentLike({});
      await UserCommentLikesTableTestHelper.addUserCommentLike({ id: 'like-456', userId: 'user-456' });
      await UserCommentLikesTableTestHelper.addUserCommentLike({ id: 'like-789', commentId: 'comment-456' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      const comment123LikeCount = await commentRepositoryPostgres.getCommentLikes('comment-123');
      const comment456LikeCount = await commentRepositoryPostgres.getCommentLikes('comment-456');

      // Assert
      expect(comment123LikeCount).toStrictEqual(2);
      expect(comment456LikeCount).toStrictEqual(1);
    });
  });
});
