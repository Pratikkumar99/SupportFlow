import Conversation from "../models/Conversation.js";
import { generateReply } from "../services/gemini.service.js";


export async function chatController(req, res) {
  try {
    const { message, conversationId } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const userId = req.user.userId;

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId,
      });

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found",
        });
      }
    } else {
      conversation = new Conversation({
        userId,
      });
    }

    conversation.messages.push({
      role: "user",
      content: message,
    });

    await conversation.save();

    const reply = await generateReply(message, userId);

    conversation.messages.push({
      role: "assistant",
      content: reply,
    });

    await conversation.save();

    res.json({
      reply,
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error("Chat error:", error);

    res.status(500).json({
      message: "Something went wrong",
    });
  }
}

export async function getConversations(req, res) {
  try {
    const userId = req.user.userId;

    const conversations = await Conversation.find({
      userId,
    })
      .sort({ updatedAt: -1 })
      .select("_id messages createdAt updatedAt");

    res.json({
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    res.status(500).json({
      message: "Something went wrong",
    });
  }
}
export async function getConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    res.json({
      conversation,
    });
  } catch (error) {
    console.error("Get conversation error:", error);

    res.status(500).json({
      message: "Something went wrong",
    });
  }
}
export async function deleteConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    const conversation = await Conversation.findOneAndDelete({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    res.json({
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);

    res.status(500).json({
      message: "Something went wrong",
    });
  }
}