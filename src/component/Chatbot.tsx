import { AiChat, useAiChatApi, useAsStreamAdapter, AiChatUI } from '@nlux/react';
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';

import { createSend } from './send';
import { getChatOptions, getCustomRenderOptions } from '../config/chatOptions';
import { stopIcon } from './icon/svgIcons';
import Greeting from './Greeting';


import '@nlux/themes/nova.css';
import styles from './Chatbot.module.css'
export interface ChatbotInterface {
  resetConversation: () => void;
}

const App = forwardRef((_, ref) => {
  const api = useAiChatApi();
  const chatAiRef = useRef({});

  const [lastSentMessage, setLastSentMessage] = useState('');
  const [isButtonVisible, setButtonVisible] = useState(false);

  const options = getChatOptions({
    setLastSentMessage,
    chatAiRef,
  });
  const customRender = getCustomRenderOptions();
  
  const [send, stopGenerating, getIsStreaming] = createSend(setButtonVisible);
  const adapter = useAsStreamAdapter(send, []);
  const onClickStop = () => {
    stopGenerating();
  };

  useImperativeHandle(ref, () => ({
    resetConversation: () => {
      stopGenerating();
      api.conversation.reset();
      api.composer.cancel();
      if (customRender?.onChatbotRefresh) {
        customRender.onChatbotRefresh();
      }
    },
  }));

  useEffect(() => {
    const inputElements = document.querySelectorAll('textarea');
    if (getIsStreaming()) {
      inputElements.forEach((input) => {
        input.setAttribute('readonly', 'readonly');
        input.setAttribute('placeholder', '正在回答您的问题...');
      });
    } else {
      inputElements.forEach((input) => {
        input.removeAttribute('readonly');
        input.setAttribute('placeholder', 'Shift + Enter 换行');
      });
    }
  }, [getIsStreaming]);

  useEffect(() => {
    if (customRender?.onInit) {
      customRender.onInit({options, api});
    }
  }, []);

  useEffect(() => {
    chatAiRef.current = {
      ...(chatAiRef?.current || {}),
      api,
      lastSentMessage,
    }
  }, [api, lastSentMessage]);

  return (
    <>
      <AiChat api={api} adapter={adapter} {...options} className={`${options?.className || ''} ${customRender?.greetingOptions ? 'rewrite-greeting' : ''}`}>
        {customRender?.greetingOptions ? <AiChatUI.Greeting>
          <Greeting options={options} api={api} greetingOptions={customRender?.greetingOptions} />
        </AiChatUI.Greeting> : ''}
      </AiChat>
      {isButtonVisible && <div className={`${styles.stopButton} ${customRender?.stopButtonClass || ''}`}>
        <button onClick={onClickStop}>{stopIcon}</button>
      </div>}
    </>
  )
});

export default App
