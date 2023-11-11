class DeleteReplyUseCase {
  constructor({ replyRepository, commentRepository, threadRepository }) {
    this._replyRepository = replyRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const {
      owner, threadId, commentId, replyId,
    } = useCasePayload;

    await this._threadRepository.getThreadById(threadId);
    await this._commentRepository.getCommentById(commentId);
    await this._replyRepository.verifyReplyAccess(replyId, owner);
    return this._replyRepository.deleteReply(replyId);
  }
}

module.exports = DeleteReplyUseCase;
