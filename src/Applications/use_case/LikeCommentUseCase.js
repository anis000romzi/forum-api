class LikeCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const { userId, threadId, commentId } = useCasePayload;
    await this._threadRepository.getThreadById(threadId);
    await this._commentRepository.getCommentById(commentId);
    const likesCount = await this._commentRepository.verifyCommentLikes(userId, commentId);
    if (likesCount > 0) {
      await this._commentRepository.deleteLikeFromComment(userId, commentId);
      return 'comment like deleted';
    }
    await this._commentRepository.addLikeToComment(userId, commentId);
    return 'comment like added';
  }
}

module.exports = LikeCommentUseCase;
