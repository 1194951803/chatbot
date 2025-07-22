import _ from 'lodash';
import { useState } from 'react';
import reRenderResponse from './index.tsx';

const defaultConfig = {
  like: {},
  disLike: {},
  flush: {},
  copy: {},
  service: {},
}

/**
 * 复制文本
 * @param str 
 */
const copyStr = async (str: string) => {
  if (navigator?.clipboard) {
    await navigator.clipboard.writeText(str);
  } else {
    const input = document.createElement('textarea');
    document.body.appendChild(input);
    input.style.width = '0px';
    input.style.height = '0px';
    input.style.opacity = '0';
    input.value = str;
    input.setAttribute('readOnly', 'readonly');
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
};

/**
 * 获取外部传入的feedback配置
 * @returns 
 */
const getFeedBackConfig = () => {
  return window.CHATBOT_CONFIG?.feedBackConfig;
}

// 包含最新的chatAi 相关方法 及 上一条消息
let chatAiRef = { current: {
  responseConfig: {},
} };

/**
 * 看起来这个方法需要一个固定的地址，先写在外面
 * @param props 
 * @param sentFunc 
 * @returns 
 */
const responseRenderer = (props: any) => {
  return reRenderResponse(props, chatAiRef);
};

// 替换原有的 feedbackState 声明
let updateFeedback: React.Dispatch<any> | null = null;

/**
 * 联系客服
 */
export const handleService = (props: any) => {
  const { api } = props?.chatAiRef?.current || {};
  if (api?.composer?.send) {
    api.composer.send('人工客服');
  }
}

/**
 * 点赞、点踩 状态保存
 */
export const useFeedbackState = () => {
  const [feedback, setFeedback] = useState({
    like: false,
    disLike: false
  });
  updateFeedback = setFeedback;
  return feedback;
};

/**
 * 点赞、点踩
 * @param props
 * @returns 
 */
export const logger = (props: any) => {
  const { handler, ...rest } = props;
  if (handler) {
    handler(rest);
  } else {
    //console.log(props?.type);
    // 新增点赞/点踩逻辑
    const type = props?.type;
    // const { type, chatAiRef } = props;
    // const { api } = chatAiRef?.current || {};
    
    if (type === 'like' || type === 'disLike') {
      // 更新反馈状态
      updateFeedback?.( (prev: { like: boolean; disLike: boolean }) => ({
        like: type === 'like' ? !prev.like : false,
        disLike: type === 'disLike' ? !prev.disLike : false
      }));
      // 调用API发送反馈
      fetch('/ai/api/chat/records/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: type === 'like' ? 'positive' : 'negative',
          sessionId: sessionStorage.getItem('chatSessionId'),
          requestId: sessionStorage.getItem('chatRequestId')
        })
      }).catch(error => {
        console.error('反馈提交失败:', error);
      });
    }
  }
};

/**
 * 复制
 * @param props 
 */
export const handleCopy = (props: any) => {
  const { handler, ...rest } = props;
  if (handler) {
    return handler(rest);
  }
  const content = props?.detail?.containerRef?.current?.innerText;
  content && copyStr(content);
}

/**
 * 重新生成
 * @param props 
 */
export const handleFlush = (props: any) => {
  const { handler, ...rest } = props;
  if (handler) {
    return handler(rest);
  }
  const { api, lastSentMessage } = props?.chatAiRef?.current || {};
  const send = api?.composer?.send;
  lastSentMessage && send && send(lastSentMessage);
}

/**
 * 是否隐藏当前信息
 * @param config 
 * @returns 
 */
export const isHide = (config: any) => config?.hide === true;

/**
 * 开启feedback相关配置
 * @param props 
 * @param options 
 * @returns 
 */
export const setFeedBackConfig = (props: any, options: any) => {
  chatAiRef = props?.chatAiRef;
  const outerConfig = getFeedBackConfig();
  const openFeedBackConfig = _.isPlainObject(outerConfig);

  if (!openFeedBackConfig || !chatAiRef?.current || !options) return;
 
  const config = _.merge({}, defaultConfig, outerConfig);
  chatAiRef.current.responseConfig = config;

  // 覆盖 messageOptions.responseRenderer 展示
  options.messageOptions = {
    ...(options?.messageOptions || {}),
    responseRenderer,
  };

  // 覆盖 messageOptions.events.messageSent 获取到最后一次发送的消息
  const originMessageSent = options.events?.messageSent;
  options.events = {
    ...(options.events || {}),
    messageSent: (messageDetail: any) => {
      if (props?.setLastSentMessage) {
        props?.setLastSentMessage(messageDetail?.message);
      }
      originMessageSent && originMessageSent(messageDetail);
    },
  }
}