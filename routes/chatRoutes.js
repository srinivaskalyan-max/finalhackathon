import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getOrCreateChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  deleteChat,
  getUnreadMessageCount
} from '../controllers/chatController.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/create', getOrCreateChat);
router.get('/', getUserChats);
router.get('/unread-count', getUnreadMessageCount);
router.get('/:chatId/messages', getChatMessages);
router.post('/:chatId/messages', sendMessage);
router.put('/:chatId/read', markMessagesAsRead);
router.delete('/:chatId', deleteChat);

export default router;
