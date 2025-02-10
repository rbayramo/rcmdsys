import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/Chatarea";
import "./styles.css";

const ChatPage = ({ sidebarOpen, toggleSidebar, selectedChat, setSelectedChat }) => {
  // Grab the ILB parameter from the URL.
  const { ilb } = useParams();
  const navigate = useNavigate();

  // When the URL parameter changes, update selectedChat.
  useEffect(() => {
    if (ilb) {
      setSelectedChat(ilb);
    }
  }, [ilb, setSelectedChat]);

  return (
    <div className="app-container">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        onSelect={(chat) => {
          setSelectedChat(chat);
          // Update the URL when a sidebar button is clicked.
          navigate(`/chat/${chat}`);
        }}
        selectedChat={selectedChat}
      />
      <ChatArea
        selectedChat={selectedChat}
        toggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
};

const App = () => {
  const [selectedChat, setSelectedChat] = useState("ILB1");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <Router>
      <Routes>
        <Route
          path="/chat/:ilb"
          element={
            <ChatPage
              sidebarOpen={sidebarOpen}
              toggleSidebar={toggleSidebar}
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
            />
          }
        />
        {/* Fallback route: if no specific chat is provided, default to ILB1 */}
        <Route
          path="*"
          element={
            <ChatPage
              sidebarOpen={sidebarOpen}
              toggleSidebar={toggleSidebar}
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
            />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
