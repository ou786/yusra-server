const express7 = require('express');
const boardRouter = express7.Router();
const boardController = require('../controllers/board.controller');
const { protect: protectMiddleware2 } = require('../middlewares/auth');

boardRouter.post('/', protectMiddleware2, boardController.createBoard);
boardRouter.get('/workspace/:workspaceId', protectMiddleware2, boardController.getBoardsInWorkspace);
boardRouter.get('/:boardId', protectMiddleware2, boardController.getBoardDetails);
boardRouter.post('/:boardId/add-member', protectMiddleware2, boardController.addMemberToBoard);
boardRouter.delete('/:boardId', protectMiddleware2, boardController.deleteBoard);
boardRouter.patch('/:boardId', protectMiddleware2, boardController.renameBoard);


module.exports = boardRouter;