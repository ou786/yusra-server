const express9 = require('express');
const cardRouter = express9.Router();
const cardController = require('../controllers/card.controller');
const { protect: protectMiddleware4 } = require('../middlewares/auth');

cardRouter.post('/', protectMiddleware4, cardController.createCard);
cardRouter.post('/move', protectMiddleware4, cardController.moveCard);
cardRouter.patch('/:cardId', protectMiddleware4, cardController.updateCard);
cardRouter.post('/:cardId/comment', protectMiddleware4, cardController.addComment);
cardRouter.delete('/:cardId', protectMiddleware4, cardController.deleteCard);

module.exports = cardRouter;