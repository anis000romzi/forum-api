/* eslint-disable no-undef */
const AddThread = require('../../../Domains/threads/entities/AddThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddThreadUseCase = require('../AddThreadUseCase');

describe('AddThreadUseCase', () => {
  it('should orchestrating the add thread action correctly', async () => {
    // Arrange
    const useCasePayload = {
      owner: 'user-123',
      title: 'testing',
      body: 'automated testing',
    };
    const mockAddedThread = new AddedThread({
      id: 'thread-123',
      owner: useCasePayload.owner,
      title: useCasePayload.title,
    });

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();

    /** mocking needed function */
    mockThreadRepository.addThread = jest.fn()
      .mockImplementation(() => Promise.resolve(mockAddedThread));

    /** creating use case instance */
    const getThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedThread = await getThreadUseCase.execute(useCasePayload);

    // Assert
    expect(addedThread).toStrictEqual(
      new AddedThread({
        id: 'thread-123',
        owner: useCasePayload.owner,
        title: useCasePayload.title,
      }),
    );
    expect(mockThreadRepository.addThread).toBeCalledWith(
      new AddThread({
        owner: useCasePayload.owner,
        title: useCasePayload.title,
        body: useCasePayload.body,
      }),
    );
  });
});
