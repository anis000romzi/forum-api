/* eslint-disable no-undef */
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');

describe('GetThreadDetailUseCase', () => {
  it('should orchestrating the get thread detail action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
    };
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.getThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve({}));
    mockCommentRepository.getCommentsByThreadId = jest.fn()
      .mockImplementation(() => Promise.resolve([{ id: 'comment-123' }]));
    mockCommentRepository.getCommentLikes = jest.fn()
      .mockImplementation(() => Promise.resolve(1));
    mockReplyRepository.getRepliesByCommentId = jest.fn()
      .mockImplementation(() => Promise.resolve([]));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    await getThreadDetailUseCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.getThreadById)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.getCommentsByThreadId)
      .toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.getCommentLikes)
      .toHaveBeenCalledWith('comment-123');
    expect(mockReplyRepository.getRepliesByCommentId)
      .toHaveBeenCalledWith('comment-123');
  });

  it('should display thread detail correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
    };
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.getThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve({
        id: 'thread-PJByal62zobLFhUggQo2m',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
      }));
    mockCommentRepository.getCommentsByThreadId = jest.fn()
      .mockImplementation(() => Promise.resolve([
        {
          id: 'comment-_pby2_tmXV6bcvcdev8xk',
          username: 'johndoe',
          date: '2021-08-08T07:22:33.555Z',
          content: 'sebuah comment',
          is_delete: true,
        },
        {
          id: 'comment-yksuCoxM2s4MMrZJO-qVD',
          username: 'dicoding',
          date: '2021-08-08T07:26:21.338Z',
          content: 'sebuah comment',
          is_delete: false,
        },
      ]));
    mockCommentRepository.getCommentLikes = jest.fn()
      .mockImplementation(() => Promise.resolve(1));
    mockReplyRepository.getRepliesByCommentId = jest.fn()
      .mockImplementation(() => Promise.resolve([]));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const threadDetail = await getThreadDetailUseCase.execute(useCasePayload);

    // Assert
    expect(threadDetail).toStrictEqual({
      id: 'thread-PJByal62zobLFhUggQo2m',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-_pby2_tmXV6bcvcdev8xk',
          username: 'johndoe',
          date: '2021-08-08T07:22:33.555Z',
          replies: [],
          content: '**komentar telah dihapus**',
          likeCount: 1,
        },
        {
          id: 'comment-yksuCoxM2s4MMrZJO-qVD',
          username: 'dicoding',
          date: '2021-08-08T07:26:21.338Z',
          replies: [],
          content: 'sebuah comment',
          likeCount: 1,
        },
      ],
    });
  });
});
