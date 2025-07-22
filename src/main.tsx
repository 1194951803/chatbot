import React from 'react'
import ReactDOM from 'react-dom/client'
import ChatbotContainer from './component/ChatbotContainer.tsx'
import "./types.d.ts"
import "./index.css"

// 查找 id 为 ballId 的 div 元素
const ballChatDiv = document.getElementById('ballChat');
if (ballChatDiv) {
  const chatbotContainer = document.createElement("div");
  ballChatDiv.appendChild(chatbotContainer);
  ReactDOM.createRoot(ballChatDiv).render(
    <React.StrictMode>
      <ChatbotContainer/>
    </React.StrictMode>,
  )
} else {
  console.error('未找到 id 为 ballId 的 div 元素');
}

