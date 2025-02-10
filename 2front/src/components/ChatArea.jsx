import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { MdAttachFile } from "react-icons/md";
import { FaPaperclip } from "react-icons/fa";

const ChatArea = ({ selectedChat, toggleSidebar, sidebarOpen }) => {
  // We now store all conversation histories in a single object.
  const [conversations, setConversations] = useState({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileAttachment, setFileAttachment] = useState(null);
  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Define the localStorage key for the conversations object.
  const conversationsKey = "conversations";

  // On mount, load the entire conversations object from localStorage.
  useEffect(() => {
    const saved = localStorage.getItem(conversationsKey);
    if (saved) {
      setConversations(JSON.parse(saved));
    }
  }, []);

  // Whenever the conversations object changes, save it to localStorage.
  useEffect(() => {
    localStorage.setItem(conversationsKey, JSON.stringify(conversations));
  }, [conversations]);

  // Retrieve the messages for the current selectedChat.
  const messages = conversations[selectedChat] || [];

  // Auto-scroll to the bottom whenever messages update.
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Helper: Group messages into conversation pairs (user & bot).
  const getLast10Pairs = () => {
    const pairs = [];
    for (let i = 0; i < messages.length; i += 2) {
      pairs.push({
        user: messages[i].text,
        bot: messages[i + 1] ? messages[i + 1].text : null,
      });
    }
    return pairs.slice(-10);
  };

  // Update conversation history for a given chat.
  const updateConversation = (chatKey, newMessages) => {
    setConversations((prev) => ({
      ...prev,
      [chatKey]: newMessages,
    }));
  };

  // Function to send conversation data to the backend.
  // It sends the stored thread id (if available) using a key based on selectedChat.
  const sendToBackend = async (newMessage, chatKey) => {
    const conversationPairs = getLast10Pairs();
    const threadKey = `${chatKey}_thread_id`;
    const storedThreadId = localStorage.getItem(threadKey) || "";
    try {
      console.log("response");
      const response = await fetch("http://localhost:5000/api/message", {
        
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: chatKey,
          conversation: conversationPairs,
          newMessage,
          thread_id: storedThreadId,
          attachments: fileAttachment ? [fileAttachment] : []
        }),
      });
      const data = await response.json();
      console.log("data", data);
      // Update the thread id for this chat in localStorage.
      if (data.thread_id) {
        localStorage.setItem(threadKey, data.thread_id);
      }
      return data.response;
    } catch (error) {
      console.error("Error sending message to backend:", error);
      return "Sorry, something went wrong.";
    }
  };

  // Handle file selection and upload.
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      // Set the attachment with the returned file_id and required tool.
      setFileAttachment({ file_id: data.file_id, tools: [{ type: "file_search" }] });
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // Helper function to send a user message and wait for the backend response.
  const sendUserMessage = async (messageText) => {
    if (!messageText.trim() || loading) return;

    // Capture the current chat.
    const currentChat = selectedChat;

    // Append the user's message.
    const userMsg = { sender: "user", text: messageText };
    const updatedMessages = [...(conversations[currentChat] || []), userMsg];
    updateConversation(currentChat, updatedMessages);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setLoading(true);
    const tempBotMsg = { sender: "bot", text: "Loading..." };
    updateConversation(currentChat, [...updatedMessages, tempBotMsg]);

    const backendResponse = await sendToBackend(messageText, currentChat);

    // Replace the temporary "Loading..." message with the actual response.
    const finalMessages = [...updatedMessages, { sender: "bot", text: backendResponse }];
    updateConversation(currentChat, finalMessages);
    setLoading(false);
    // Clear the file attachment after sending.
    setFileAttachment(null);
  };

  // Handle send action.
  const handleSend = async () => {
    await sendUserMessage(input);
  };

  // Handle suggestion card click.
  const handleSuggestion = async () => {
    const suggestionText = `If I as a client tell you my project needs, will you be able to create the best specific ${selectedChat} BluePrint Recommendation System for me?`;
    await sendUserMessage(suggestionText);
  };

  // Auto-expand the textarea.
  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    const newHeight = Math.min(e.target.scrollHeight, 144); // up to 5 lines
    e.target.style.height = `${newHeight}px`;
  };

  // Handle Enter key (without Shift) to send message.
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-area">
      {/* Chat Header */}
      <div className="chat-header">
        <h2>{selectedChat} BluePrint Recommendation System</h2>
        {messages.length > 0 && !loading && (
          <button
            className="clear-btn"
            onClick={() => {
              const threadKey = `${selectedChat}_thread_id`;
              updateConversation(selectedChat, []);
              localStorage.removeItem(threadKey);
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Mobile open-sidebar button */}
      {!sidebarOpen && (
        <button className="open-sidebar-btn" onClick={toggleSidebar}>
          ☰
        </button>
      )}

      {/* File Input for attachments */}
      {/* <div style={{ padding: "10px 20px" }}>
        <input type="file" onChange={handleFileChange} />
      </div> */}

      {/* Messages Container */}
      <div className="messages-container" ref={messagesContainerRef}>
        <div className="messages">
          {messages.length === 0 ? (
            <div className="no-messages">
              <img
                src="https://ccqq-bot.vercel.app/Logo.webp"
                alt="Logo"
                className="no-messages-logo"
              />
              <h3 className="no-messages-title">
                {selectedChat} BluePrint Recommendation System (prototype)
              </h3>
              <p className="no-messages-subtitle">
                by Deep Knwoledge Analytics Limited
              </p>
              <p className="no-messages-description">
                Deep Knowledge Group's AI-driven recommendation system copilot for
                assisting their clients, partners and associates in assembling an{" "}
                {selectedChat} configuration
              </p>
              <div className="suggestion-card" onClick={handleSuggestion}>
                If I as a client tell you my project needs, will you be able to create
                the best specific {selectedChat} BluePrint Recommendation System for me?
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={msg.sender === "user" ? "user-msg" : "bot-msg"}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Input */}
      <div className="chat-input">
      <div className="input-wrapper" style={{ position: "relative" }}>
  <label 
    htmlFor="file-upload" 
    style={{
      position: "absolute",
      left: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer",
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "24px",
      height: "24px"
    }}
  >
    <FaPaperclip size={24} color="#4499d4" />
  </label>
  <input
    id="file-upload"
    type="file"
    onChange={handleFileChange}
    style={{ display: "none" }}
  />
  <textarea
    ref={textareaRef}
    value={input}
    onChange={handleInput}
    onKeyDown={handleKeyDown}
    placeholder="Type a message..."
    style={{ height: "auto", paddingLeft: "50px" }} // Ensure enough left padding for the icon
  />
  <button onClick={handleSend} className="send-btn" aria-label="Send">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  </button>
</div>

      </div>
    </div>
  );
};

export default ChatArea;
