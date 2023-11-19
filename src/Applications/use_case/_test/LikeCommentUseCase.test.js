/* eslint-disable no-undef */
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const LikeCommentUseCase = require('../LikeCommentUseCase');

describe('LikeCommentUseCase', () => {
  it('should orchestrating the like comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      userId: 'user-123',
      threadId: 'thread-123',
      commentId: 'comment-123',
    };
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.getThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve({}));
    mockCommentRepository.getCommentById = jest.fn()
      .mockImplementation(() => Promise.resolve({}));
    mockCommentRepository.verifyCommentLikes = jest.fn()
      .mockImplementation(() => Promise.resolve(0));
    mockCommentRepository.addLikeToComment = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.deleteLikeFromComment = jest.fn()
      .mockImplementation(() => Promise.resolve());

    const likeCommentUseCase = new LikeCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    await likeCommentUseCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.getThreadById)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.getCommentById)
      .toBeCalledWith(useCasePayload.commentId);
    expect(mockCommentRepository.verifyCommentLikes)
      .toHaveBeenCalledWith(useCasePayload.userId, useCasePayload.commentId);
    expect(mockCommentRepository.addLikeToComment)
      .toHaveBeenCalledWith(useCasePayload.userId, useCasePayload.commentId);
  });

  it('should orchestrating the unlike comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      userId: 'user-123',
      threadId: 'thread-123',
      commentId: 'comment-123',
    };
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.getThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve({}));
    mockCommentRepository.getCommentById = jest.fn()
      .mockImplementation(() => Promise.resolve({}));
    mockCommentRepository.verifyCommentLikes = jest.fn()
      .mockImplementation(() => Promise.resolve(1));
    mockCommentRepository.addLikeToComment = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.deleteLikeFromComment = jest.fn()
      .mockImplementation(() => Promise.resolve());

    const likeCommentUseCase = new LikeCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    await likeCommentUseCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.getThreadById)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.getCommentById)
      .toBeCalledWith(useCasePayload.commentId);
    expect(mockCommentRepository.verifyCommentLikes)
      .toHaveBeenCalledWith(useCasePayload.userId, useCasePayload.commentId);
    expect(mockCommentRepository.deleteLikeFromComment)
      .toHaveBeenCalledWith(useCasePayload.userId, useCasePayload.commentId);
  });
});
