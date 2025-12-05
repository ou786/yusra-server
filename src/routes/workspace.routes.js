const express6 = require('express');
const wsRouter = express6.Router();
const workspaceController = require('../controllers/workspace.controller');
const { protect: protectMiddleware } = require('../middlewares/auth');

wsRouter.post('/', protectMiddleware, workspaceController.createWorkspace);
wsRouter.get('/', protectMiddleware, workspaceController.getWorkspaces);
wsRouter.get('/:workspaceId', protectMiddleware, workspaceController.getWorkspace);
wsRouter.post('/:workspaceId/add-member', protectMiddleware, workspaceController.addMember);
wsRouter.post('/:workspaceId/remove-member', protectMiddleware, workspaceController.removeMember);
wsRouter.delete('/:workspaceId', protectMiddleware, workspaceController.deleteWorkspace);
wsRouter.patch('/:workspaceId', protectMiddleware, workspaceController.renameWorkspace);

module.exports = wsRouter;