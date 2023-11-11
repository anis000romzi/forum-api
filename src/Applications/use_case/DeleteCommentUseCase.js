class DeleteCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const { owner, threadId, commentId } = useCasePayload;
    await this._threadRepository.getThreadById(threadId);
    await this._commentRepository.verifyCommentAccess(commentId, owner);
    return this._commentRepository.deleteComment(commentId);
  }
}

module.exports = DeleteCommentUseCase;
