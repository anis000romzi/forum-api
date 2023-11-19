const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');
const DeleteCommentUseCase = require('../../../../Applications/use_case/DeleteCommentUseCase');
const LikeCommentUseCase = require('../../../../Applications/use_case/LikeCommentUseCase');

class CommentsHandler {
  constructor(container) {
    this._container = container;

    this.postCommentHandler = this.postCommentHandler.bind(this);
    this.deleteCommentHandler = this.deleteCommentHandler.bind(this);
    this.likeCommentHandler = this.likeCommentHandler.bind(this);
  }

  async postCommentHandler(request, h) {
    const { threadId } = request.params;
    const { content } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const addCommentUseCase = this._container.getInstance(AddCommentUseCase.name);
    const addedComment = await addCommentUseCase.execute({ threadId, owner: credentialId, content });

    const response = h.response({
      status: 'success',
      data: {
        addedComment,
      },
    });
    response.code(201);
    return response;
  }

  async deleteCommentHandler(request) {
    const { threadId, commentId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    const deleteCommentUseCase = this._container.getInstance(DeleteCommentUseCase.name);
    await deleteCommentUseCase.execute({ owner: credentialId, threadId, commentId });

    return {
      status: 'success',
    };
  }

  async likeCommentHandler(request) {
    const { threadId, commentId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    const likeCommentUseCase = this._container.getInstance(LikeCommentUseCase.name);
    const message = await likeCommentUseCase.execute({ userId: credentialId, threadId, commentId });

    return {
      status: 'success',
      message,
    };
  }
}

module.exports = CommentsHandler;
