class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(useCasePayload) {
    const thread = await this._threadRepository.getThreadById(useCasePayload.threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(useCasePayload.threadId);
    const mapppedComments = comments.map(this._changeDeletedComments);

    const commentsWithReplies = await Promise.all(mapppedComments.map(async ({
      id, username, date, content,
    }) => {
      const replies = await this._replyRepository.getRepliesByCommentId(id);
      const mappedReplies = replies.map(this._changeDeletedReplies);
      const likeCount = await this._commentRepository.getCommentLikes(id);

      return {
        id,
        username,
        date,
        replies: mappedReplies,
        content,
        likeCount,
      };
    }));

    return { ...thread, comments: commentsWithReplies };
  }

  _changeDeletedReplies({
    id, username, date, content, is_delete,
  }) {
    if (is_delete) {
      return {
        id,
        content: '**balasan telah dihapus**',
        date,
        username,
      };
    }
    return {
      id,
      content,
      date,
      username,
    };
  }

  _changeDeletedComments({
    id, username, date, content, is_delete,
  }) {
    if (is_delete) {
      return {
        id,
        username,
        date,
        content: '**komentar telah dihapus**',
      };
    }
    return {
      id,
      username,
      date,
      content,
    };
  }
}

module.exports = GetThreadDetailUseCase;
