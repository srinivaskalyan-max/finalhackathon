import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { getIO } from '../config/socket.js';
import { createNotification } from './notificationController.js';

// Get or create chat between two users
export const getOrCreateChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user.id;

    if (userId === participantId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot create chat with yourself' 
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Find existing chat
    let chat = await Chat.findOne({
      participants: { $all: [userId, participantId] }
    }).populate('participants', 'name email');

    // Create new chat if doesn't exist
    if (!chat) {
      chat = await Chat.create({
        participants: [userId, participantId],
        participantNames: [req.user.name, participant.name],
        messages: []
      });

      chat = await Chat.findById(chat._id).populate('participants', 'name email');
    }

    res.json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get or create chat',
      error: error.message 
    });
  }
};

// Get all chats for user
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id,
      isActive: true
    })
      .populate('participants', 'name email')
      .sort({ 'lastMessage.timestamp': -1 });

    res.json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch chats',
      error: error.message 
    });
  }
};

// Get chat messages
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user.id
    });

    if (!chat) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chat not found' 
      });
    }

    // Get paginated messages
    const messages = chat.messages
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice((page - 1) * limit, page * limit)
      .reverse();

    res.json({ 
      success: true, 
      data: {
        messages,
        total: chat.messages.length,
        page: parseInt(page),
        pages: Math.ceil(chat.messages.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch messages',
      error: error.message 
    });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message content is required' 
      });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user.id
    });

    if (!chat) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chat not found' 
      });
    }

    // Create message
    const message = {
      sender: req.user.id,
      senderName: req.user.name,
      content: content.trim(),
      read: false
    };

    chat.messages.push(message);
    chat.lastMessage = {
      content: content.trim(),
      timestamp: new Date(),
      sender: req.user.id
    };

    await chat.save();

    const newMessage = chat.messages[chat.messages.length - 1];

    // Emit real-time message
    const io = getIO();
    io.to(`chat:${chatId}`).emit('new_message', {
      chatId,
      message: newMessage
    });

    // Create notification for other participant
    const otherParticipant = chat.participants.find(
      p => p.toString() !== req.user.id
    );

    if (otherParticipant) {
      await createNotification({
        recipient: otherParticipant,
        sender: req.user.id,
        type: 'chat_message',
        title: 'New Message',
        message: `${req.user.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        link: `/chat/${chatId}`,
        metadata: {
          chatId: chatId
        }
      });
    }

    res.json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message',
      error: error.message 
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user.id
    });

    if (!chat) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chat not found' 
      });
    }

    // Mark unread messages as read
    chat.messages.forEach(msg => {
      if (msg.sender.toString() !== req.user.id && !msg.read) {
        msg.read = true;
        msg.readAt = new Date();
      }
    });

    await chat.save();

    res.json({ 
      success: true, 
      message: 'Messages marked as read' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark messages as read',
      error: error.message 
    });
  }
};

// Delete chat
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, participants: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chat not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Chat deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete chat',
      error: error.message 
    });
  }
};

// Get unread message count
export const getUnreadMessageCount = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id,
      isActive: true
    });

    let unreadCount = 0;
    chats.forEach(chat => {
      chat.messages.forEach(msg => {
        if (msg.sender.toString() !== req.user.id && !msg.read) {
          unreadCount++;
        }
      });
    });

    res.json({ success: true, count: unreadCount });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get unread count',
      error: error.message 
    });
  }
};
