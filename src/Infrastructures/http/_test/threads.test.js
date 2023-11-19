/* eslint-disable no-undef */
const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

jest.useRealTimers();

describe('/threads endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  describe('when POST /threads', () => {
    it('should response 401 if not authenticated', async () => {
      // Arrange
      const requestPayload = {
        title: 'testing',
        body: 'automated testing',
      };

      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.message).toEqual('Missing authentication');
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const requestPayload = {
        title: 'testing',
      };

      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'tester',
          password: '123456',
          fullname: 'Application Tester',
        },
      });

      // login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'tester',
          password: '123456',
        },
      });
      const { data: { accessToken } } = JSON.parse(loginResponse.payload);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      // Arrange
      const requestPayload = {
        title: 'testing',
        body: true,
      };

      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'tester',
          password: '123456',
          fullname: 'Application Tester',
        },
      });

      // login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'tester',
          password: '123456',
        },
      });
      const { data: { accessToken } } = JSON.parse(loginResponse.payload);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('tidak dapat membuat thread baru karena tipe data tidak sesuai');
    });

    it('should response 201 and persisted thread', async () => {
      // Arrange
      const requestPayload = {
        title: 'testing',
        body: 'automated testing',
      };

      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'tester',
          password: '123456',
          fullname: 'Application Tester',
        },
      });

      // login
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'tester',
          password: '123456',
        },
      });
      const { data: { accessToken } } = JSON.parse(loginResponse.payload);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedThread).toBeDefined();
    });
  });

  describe('when GET /threads/{threadId}', () => {
    it('should response 404 if thread not found', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/threads/thread-123',
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.message).toEqual('thread tidak ditemukan');
    });

    it('should response 200 and display thread correctly', async () => {
      // Arrange
      const server = await createServer(container);

      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'tester',
          password: '123456',
          fullname: 'Application Tester',
        },
      });

      // login user
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'tester',
          password: '123456',
        },
      });
      const { data: { accessToken } } = JSON.parse(loginResponse.payload);

      // add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'testing',
          body: 'automated testing',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const { data: { addedThread } } = JSON.parse(threadResponse.payload);

      // add comments
      const commentResponse1 = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments`,
        payload: {
          content: 'testing',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const commentResponse2 = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments`,
        payload: {
          content: 'testing',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const { data: { addedComment: addedComment1 } } = JSON.parse(commentResponse1.payload);
      const { data: { addedComment: addedComment2 } } = JSON.parse(commentResponse2.payload);

      // delete one comment
      await server.inject({
        method: 'DELETE',
        url: `/threads/${addedThread.id}/comments/${addedComment2.id}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // add replies
      await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments/${addedComment1.id}/replies`,
        payload: {
          content: 'testing',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const replyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments/${addedComment1.id}/replies`,
        payload: {
          content: 'testing',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const { data: { addedReply } } = JSON.parse(replyResponse.payload);

      // delete one reply
      await server.inject({
        method: 'DELETE',
        url: `/threads/${addedThread.id}/comments/${addedComment1.id}/replies/${addedReply.id}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // like comment
      await server.inject({
        method: 'PUT',
        url: `/threads/${addedThread.id}/comments/${addedComment1.id}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Action
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${addedThread.id}`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.thread).toBeDefined();
      expect(responseJson.data.thread.comments[0].content).toStrictEqual('testing');
      expect(responseJson.data.thread.comments[0].likeCount).toStrictEqual(1);
      expect(responseJson.data.thread.comments[1].content).toStrictEqual('**komentar telah dihapus**');
      expect(responseJson.data.thread.comments[1].likeCount).toStrictEqual(0);
      expect(responseJson.data.thread.comments[0].replies[0].content).toStrictEqual('testing');
      expect(responseJson.data.thread.comments[0].replies[1].content).toStrictEqual('**balasan telah dihapus**');
    }, 10000);
  });
});
