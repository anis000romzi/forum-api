/* eslint-disable no-undef */
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const AddReply = require('../../../Domains/replies/entities/AddReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const pool = require('../../database/postgres/pool');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');

describe('ReplyRepositoryPostgres', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist after adding a reply', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ title: 'testing', body: 'automated testing' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      const addReply = new AddReply({
        commentId: 'comment-123',
        owner: 'user-123',
        content: 'automated testing',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await replyRepositoryPostgres.addReply(addReply);

      // Assert
      const replies = await RepliesTableTestHelper.findReplyById('reply-123');
      expect(replies).toHaveLength(1);
    });

    it('should return added content correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ title: 'testing', body: 'automated testing' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      const addReply = new AddReply({
        commentId: 'comment-123',
        owner: 'user-123',
        content: 'automated testing',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedReply = await replyRepositoryPostgres.addReply(addReply);

      // Assert
      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: 'automated testing',
        owner: 'user-123',
      }));
    });
  });

  describe('verifyReplyAccess function', () => {
    it('should throw NotFoundError when reply not found', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyAccess('reply-123', 'user-123')).rejects.toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when reply not owned by user', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      await RepliesTableTestHelper.addReply({ content: 'testing' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyAccess('reply-123', 'user-456')).rejects.toThrowError(AuthorizationError);
    });

    it('should not throw AuthorizationError when reply owned by user', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      await RepliesTableTestHelper.addReply({ content: 'testing' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyAccess('reply-123', 'user-123')).resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('deleteReply function', () => {
    it('should throw NotFoundError when reply not found', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.deleteReply('reply-456')).rejects.toThrowError(NotFoundError);
    });

    it('should change is_delete to true', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ content: 'testing' });
      await RepliesTableTestHelper.addReply({ content: 'testing' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      await replyRepositoryPostgres.deleteReply('reply-123');
      const deletedReply = await RepliesTableTestHelper.findReplyById('reply-123');

      // Assert
      expect(deletedReply[0].is_delete).toStrictEqual(true);
    });
  });

  describe('getRepliesByCommentId function', () => {
    it('should return correct replies based on commentId', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'tester' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'tester_2' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-456' });
      await RepliesTableTestHelper.addReply({ commentId: 'comment-123' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-456', commentId: 'comment-456', owner: 'user-456', content: 'testing testing',
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      const commentReplies123 = await replyRepositoryPostgres.getRepliesByCommentId('comment-123');
      const commentReplies456 = await replyRepositoryPostgres.getRepliesByCommentId('comment-456');

      // Action & Assert
      expect(commentReplies123[0]).toStrictEqual({
        id: 'reply-123',
        content: 'testing',
        username: 'tester',
        date: '2021-08-08T07:22:33.555Z',
        is_delete: false,
      });
      expect(commentReplies456[0]).toStrictEqual({
        id: 'reply-456',
        content: 'testing testing',
        username: 'tester_2',
        date: '2021-08-08T07:22:33.555Z',
        is_delete: false,
      });
    });
  });
});
