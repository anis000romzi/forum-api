/* eslint-disable no-undef */
const AddComment = require('../AddComment');

describe('a AddComment entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      threadId: 'thread-123',
      owner: 'user-123',
    };

    // Action and Assert
    expect(() => new AddComment(payload)).toThrowError('ADD_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      threadId: 'thread-123',
      owner: 'user-123',
      content: 123,
    };

    // Action and Assert
    expect(() => new AddComment(payload)).toThrowError('ADD_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create AddComment object correctly', () => {
    // Arrange
    const payload = {
      threadId: 'thread-123',
      owner: 'user-123',
      content: 'testing',
    };

    // Action
    const { threadId, owner, content } = new AddComment(payload);

    // Assert
    expect(threadId).toEqual(payload.threadId);
    expect(owner).toEqual(payload.owner);
    expect(content).toEqual(payload.content);
  });
});
