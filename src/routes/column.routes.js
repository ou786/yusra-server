const express8 = require('express');
const columnRouter = express8.Router();
const columnController = require('../controllers/column.controller');
const { protect: protectMiddleware3 } = require('../middlewares/auth');

columnRouter.post('/', protectMiddleware3, columnController.createColumn);
columnRouter.patch('/:columnId', protectMiddleware3, columnController.renameColumn);
columnRouter.post('/reorder', protectMiddleware3, columnController.reorderColumns);
columnRouter.delete('/:columnId', protectMiddleware3, columnController.deleteColumn);
columnRouter.post("/reorder", protectMiddleware3, columnController.reorderColumns);


module.exports = columnRouter;