import { useEffect, useState } from "react";
import Login from "./Login.js";
import Signup from "./Signup.js";
import { marked } from "marked";
import { PanelLeft, PanelLeftClose, Trash2, RotateCcw } from "lucide-react";

export default function App() {
  const [page, setPage] = useState(() => {
    const token = localStorage.getItem("token");

    return token ? "chat" : "login";
  });
  if (page === "login") {
    return (
      <Login
        onLogin={() => setPage("chat")}
        onSignup={() => setPage("signup")}
      />
    );
  }
  if (page === "signup") {
    return (
      <Signup
        onSignup={() => setPage("login")}
        onLogin={() => setPage("login")}
      />
    );
  }
  return <Chat onLogout={() => setPage("login")} />;
}
function Chat({ onLogout }) {
  const [conversationId, setConversationId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [failedMessage, setFailedMessage] = useState(null);
  const [failedAssistantId, setFailedAssistantId] = useState(null);
  const [retryingMessageId, setRetryingMessageId] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hi! How can I help you today?",
    },
  ]);

  // ================= DELETE CONVERSATION =================

  async function handleDeleteConversation(id) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/chat/conversations/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        return;
      }

      // Remove conversation from sidebar
      setConversations((prev) =>
        prev.filter((conversation) => conversation._id !== id),
      );

      // If currently opened conversation was deleted
      if (conversationId === id) {
        setConversationId(null);

        setMessages([
          {
            id: Date.now(),
            role: "assistant",
            content: "Hi! How can I help you today?",
          },
        ]);

        setFailedMessage(null);
        setFailedAssistantId(null);
        setRetryingMessageId(null);
      }
    } catch (error) {
      console.error("Delete conversation error:", error);
    }
  }

  // ================= FETCH CONVERSATIONS =================

  useEffect(() => {
    async function fetchConversations() {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/chat/conversations",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(data.message);
          return;
        }

        setConversations(data.conversations);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    }

    fetchConversations();
  }, []);

  // ================= OPEN CONVERSATION =================

  async function handleConversationClick(id) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/chat/conversations/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        return;
      }

      setConversationId(data.conversation._id);

      setMessages(
        data.conversation.messages.map((msg) => ({
          id: msg._id,
          role: msg.role,
          content: msg.content,
        })),
      );

      // Clear retry states when changing conversation
      setFailedMessage(null);
      setFailedAssistantId(null);
      setRetryingMessageId(null);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  }

  // ================= SEND NEW MESSAGE =================

  async function handleSend() {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    const newMessage = {
      id: Date.now(),
      role: "user",
      content: userMessage,
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    await sendMessage(userMessage);
  }

  // ================= SEND / RETRY MESSAGE =================

  async function sendMessage(userMessage, retryMessageId = null) {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          message: userMessage,
          conversationId,
        }),
      });

      const data = await response.json();

      // ==================================================
      // API FAILED
      // ==================================================

      if (!response.ok) {
        const failedId = retryMessageId || Date.now();

        setFailedMessage(userMessage);
        setFailedAssistantId(failedId);
        setRetryingMessageId(null);

        setMessages((prev) => {
          // ----------------------------------------------
          // RETRY FAILED
          // Update the SAME assistant message
          // ----------------------------------------------

          if (retryMessageId) {
            return prev.map((msg) =>
              msg.id === retryMessageId
                ? {
                    ...msg,
                    content:
                      "Sorry, I'm temporarily unavailable right now. Please try again.",
                  }
                : msg,
            );
          }

          // ----------------------------------------------
          // FIRST REQUEST FAILED
          // Create a new assistant message
          // ----------------------------------------------

          return [
            ...prev,
            {
              id: failedId,
              role: "assistant",
              content:
                "Sorry, I'm temporarily unavailable right now. Please try again.",
            },
          ];
        });

        return;
      }

      // ==================================================
      // API SUCCESS
      // ==================================================

      setLoading(false);

      setFailedMessage(null);
      setFailedAssistantId(null);
      setRetryingMessageId(null);

      setConversationId(data.conversationId);

      // ==================================================
      // UPDATE SIDEBAR
      // Only update conversation for a NEW message.
      // Retry should not add duplicate user messages.
      // ==================================================

      if (!retryMessageId) {
        setConversations((prev) => {
          const existing = prev.find(
            (conversation) =>
              conversation._id === data.conversationId,
          );

          if (existing) {
            return prev.map((conversation) =>
              conversation._id === data.conversationId
                ? {
                    ...conversation,
                    messages: [
                      ...(conversation.messages || []),
                      {
                        role: "user",
                        content: userMessage,
                      },
                    ],
                  }
                : conversation,
            );
          }

          return [
            {
              _id: data.conversationId,
              messages: [
                {
                  role: "user",
                  content: userMessage,
                },
              ],
            },
            ...prev,
          ];
        });
      }

      // ==================================================
      // ASSISTANT RESPONSE
      // ==================================================

      const assistantMessage = {
        id: retryMessageId || Date.now(),
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => {
        // ----------------------------------------------
        // RETRY SUCCESS
        // Replace failed/loading message
        // ----------------------------------------------

        if (retryMessageId) {
          return prev.map((msg) =>
            msg.id === retryMessageId
              ? assistantMessage
              : msg,
          );
        }

        // ----------------------------------------------
        // NORMAL MESSAGE
        // Add new assistant response
        // ----------------------------------------------

        return [...prev, assistantMessage];
      });
    } catch (error) {
      console.error("Error:", error);

      const failedId = retryMessageId || Date.now();

      setFailedMessage(userMessage);
      setFailedAssistantId(failedId);
      setRetryingMessageId(null);

      setMessages((prev) => {
        // Retry failed again
        if (retryMessageId) {
          return prev.map((msg) =>
            msg.id === retryMessageId
              ? {
                  ...msg,
                  content:
                    "Something went wrong. Please try again.",
                }
              : msg,
          );
        }

        // First request failed
        return [
          ...prev,
          {
            id: failedId,
            role: "assistant",
            content: "Something went wrong. Please try again.",
          },
        ];
      });
    } finally {
      setLoading(false);
    }
  }

  // ================= UI =================

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="flex h-[600px] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">

        {/* ================= SIDEBAR ================= */}

        {sidebarOpen && (
          <aside className="w-64 shrink-0 border-r border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-700 p-4">
              <h2 className="font-semibold text-white">
                Conversations
              </h2>

              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <PanelLeftClose size={20} />
              </button>
            </div>

            <div className="p-3">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className="mb-2 flex items-center rounded-lg hover:bg-slate-800"
                >
                  {/* Conversation */}

                  <button
                    onClick={() =>
                      handleConversationClick(conversation._id)
                    }
                    className="min-w-0 flex-1 p-3 text-left text-sm text-slate-300"
                  >
                    <span className="block truncate">
                      {conversation.messages?.[0]?.content ||
                        "New conversation"}
                    </span>
                  </button>

                  {/* Delete */}

                  <button
                    onClick={() =>
                      handleDeleteConversation(conversation._id)
                    }
                    className="mr-2 rounded-md p-2 text-slate-500 hover:bg-slate-700 hover:text-red-400"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* ================= CHAT ================= */}

        <div className="flex flex-1 flex-col">

          {/* ================= HEADER ================= */}

          <header className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-6 py-4">
            <div className="flex items-center gap-3">

              <button
                onClick={() =>
                  setSidebarOpen((prev) => !prev)
                }
                className={`rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white ${
                  sidebarOpen ? "hidden" : "block"
                }`}
              >
                <PanelLeft size={20} />
              </button>

              <div>
                <h1 className="text-xl font-semibold text-white">
                  SupportFlow
                </h1>

                <p className="text-sm text-slate-400">
                  AI Support Assistant
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                onLogout();
              }}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Logout
            </button>
          </header>

          {/* ================= MESSAGES ================= */}

          <main className="relative flex-1 space-y-4 overflow-y-auto bg-slate-950/50 p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {/* =========================================
                    RETRY LOADING STATE
                    Replace failed message with loading UI
                   ========================================= */}

                {retryingMessageId === msg.id ? (
                  <div className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-400">
                    SupportFlow is thinking...
                  </div>
                ) : (
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "border border-slate-700 bg-slate-800 text-slate-100"
                    }`}
                  >
                    <div
                      className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(msg.content),
                      }}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* ================= RETRY BUTTON ================= */}

            {failedMessage &&
              !loading &&
              failedAssistantId && (
                <div className="flex justify-start">
                  <button
                    onClick={() => {
                      setRetryingMessageId(
                        failedAssistantId,
                      );

                      sendMessage(
                        failedMessage,
                        failedAssistantId,
                      );
                    }}
                    className="mt-[-13px] ml-1 flex cursor-pointer items-center rounded-lg border border-slate-700 px-2 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              )}
          </main>

          {/* ================= INPUT ================= */}

          <footer className="border-t border-slate-700 bg-slate-900 p-4">
            <div className="flex gap-3">

              <input
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
                placeholder="Ask about your order..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

              <button
                onClick={handleSend}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Thinking..." : "Send"}
              </button>

            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
