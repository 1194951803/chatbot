import React, { useEffect, useRef, useState } from 'react';

import AiChatDragPlugin from './DragPlugin';
import Chatbot, {ChatbotInterface} from './Chatbot';
import { getChatOptions } from '../config/chatOptions';
import styles from './ChatbotContainer.module.css';
import { closeIcon, refreshIcon } from './icon/svgIcons';

const BUBBLE_ID = 'webChat-bubble-tip';
const CHATBOT_DIALOG_ID = 'webChat-dialog';

const ChatbotContainer: React.FC = () => {
  const options = getChatOptions();
  const bubbleImage = options?.personaOptions?.assistant?.avatar;

  const [isChatBoxVisible, setIsChatBoxVisible] = useState(window.CHATBOT_CONFIG.displayByDefault || false);
  const chatRef = useRef(null);

  const toggleChatBox = () => {
    setIsChatBoxVisible(!isChatBoxVisible);
  };

  const onClickRefresh = (event:any) => {
    (chatRef.current as unknown as ChatbotInterface).resetConversation();
    sessionStorage.removeItem('chatSessionId');
    event?.stopPropagation();
  };

  useEffect(() => {
    // 拖拽插件运行
    const domElement = document.getElementById(BUBBLE_ID);
    const dialogElement = document.getElementById(CHATBOT_DIALOG_ID);
    const chatDragPlugin = new AiChatDragPlugin({
      domElement,
      dialogElement,
      toggleChatBox,
      visible: isChatBoxVisible,
      bubbleImage,
    });
    chatDragPlugin.init();
    return () => {
      chatDragPlugin.destroy();
    };
  }, [isChatBoxVisible])

  return (
    <>
      {/* 气泡提示 */}
      <div
        id={BUBBLE_ID}
        className={'webchat-bubble-tip '+ styles.bubbleTip}
        style={{ backgroundImage: `url(${bubbleImage})` }}
        onClick={window.CHATBOT_CONFIG?.draggable ? () => {} : toggleChatBox}
      >
      </div>

      {/* 聊天框容器 */}
      <div
        id={CHATBOT_DIALOG_ID}
        className={`webchat-container ${styles.chatBoxContainer} ${isChatBoxVisible ? styles.chatBoxVisible : ''}`} // 动态添加显示状态的类
      >
        <div className={'webchat-container-toolbar ' + styles.toolbar}>
          <span className={styles.title}>{ window.CHATBOT_CONFIG?.title || 'AI 助手'}</span>
          <button className={styles.refreshButton} onClick={onClickRefresh} >
            {refreshIcon}
          </button>
          {/* 关闭按钮 */}
          <button
            className={styles.closeButton}
            onClick={(event) => {
                setIsChatBoxVisible(false)
                event.stopPropagation();
              }
            }
          >
            {closeIcon}
          </button>
        </div>
        <Chatbot ref={chatRef}/>
      </div>
    </>
  );
};

export default ChatbotContainer;
