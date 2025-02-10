import React from "react";

const Sidebar = ({ onSelect, isOpen, toggleSidebar, selectedChat }) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <img
          src="https://ccqq-bot.vercel.app/Logo.webp"
          alt="Logo"
          className="sidebar-logo"
        />
        {/* On mobile, when sidebar is open, show the close (X) button */}
        <button className="toggle-btn close-btn" onClick={toggleSidebar}>
          ✖
        </button>
      </div>
      <div className="sidebar-content">
        {["ILB1", "ILB2", "ILB3", "ILB4"].map((item) => (
          <button
            key={item}
            onClick={() => onSelect(item)}
            className={selectedChat === item ? "selected" : ""}
          >
            {item} BluePrint Recommendation System
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
