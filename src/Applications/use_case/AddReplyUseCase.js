const AddReply = require('../../Domains/replies/entities/AddReply');

class AddReplyUseCase {
  constructor({ replyRepository, commentRepository, threadRepository }) {
    this._replyRepository = replyRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const {
      threadId, commentId, owner, content,
    } = useCasePayload;
    const addReply = new AddReply({ commentId, owner, content });

    await this._threadRepository.getThreadById(threadId);
    await this._commentRepository.getCommentById(commentId);
    return this._replyRepository.addReply(addReply);
  }
}

module.exports = AddReplyUseCase;
