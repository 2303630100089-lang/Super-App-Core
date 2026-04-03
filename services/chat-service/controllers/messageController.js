import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import { generateKey, encrypt, decrypt } from '../utils/encryption.js';

// Retrieve (or lazily create) the encryption key for a chat.
const getChatEncryptionKey = async (chatId) => {
  const chat = await Chat.findById(chatId).select('+encryptionKey');
  if (!chat) return null;
  if (!chat.encryptionKey) {
    chat.encryptionKey = generateKey();
    await chat.save();
  }
  return chat.encryptionKey;
};

const sendMessage = async (req, res) => {
  const { content, chatId, senderId, messageType, type, replyTo, replyToId } = req.body;
  if (!content || !chatId) return res.sendStatus(400);

  try {
    const encryptionKey = await getChatEncryptionKey(chatId);

    const newMessage = {
      sender: senderId,
      chat: chatId,
      messageType: messageType || type || 'text',
      replyTo: replyTo || replyToId || null,
    };

    if (encryptionKey) {
      // Store only the encrypted form; do not persist plaintext
      newMessage.encryptedContent = encrypt(content, encryptionKey);
      newMessage.encryptionKeyId = chatId;
    } else {
      newMessage.content = content;
    }

    let message = await Message.create(newMessage);
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const allMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const encryptionKey = await getChatEncryptionKey(chatId);

    const messages = await Message.find({ chat: chatId })
      .populate('sender')
      .populate('chat')
      .populate('replyTo');

    // Decrypt messages for the response; never expose the key itself
    const decrypted = messages.map(msg => {
      const plain = msg.toObject();
      if (plain.encryptedContent && encryptionKey) {
        plain.content = decrypt(plain.encryptedContent, encryptionKey);
        delete plain.encryptedContent;
        delete plain.encryptionKeyId;
      }
      return plain;
    });

    res.json(decrypted);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const reactToMessage = async (req, res) => {
  const { messageId, userId, emoji } = req.body;
  try {
    const message = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { reactions: { user: userId, emoji } } },
      { new: true }
    );
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export default { sendMessage, allMessages, reactToMessage };
