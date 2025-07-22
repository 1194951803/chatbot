import { copyIcon, flushIcon, likeIcon, disLikeIcon, likedIcon, disLikedIcon, serviceIcon } from "../icon/svgIcons.tsx";
import { isHide, handleCopy, handleFlush, logger, useFeedbackState, handleService } from "./utils.ts";

import './index.css';

const PREFIX = 'chat-message-item';
const MESSAGE_FOOTER = `${PREFIX}-footer`;
const MESSAGE_ICON = `${PREFIX}-icon`;

/**
 * 重写恢复信息组件（由于外部script标签没办法写js逻辑，所在外部传入开关，暂时在这里写一个固定的渲染做测试用）
 * @param props 
 * @param chatAiRef 
 * @returns 
 */
const reRenderResponse = (props: any, chatAiRef: any) => {
  const isWechat = props?.content?.[0]?.includes('hjhrcloud.com/assets/images/wxkf.png');  // 特殊处理微信客服不展示反馈状态
  const { like, disLike, refresh, copy, service } = chatAiRef?.current?.responseConfig || {};
  const isShowLike = !isHide(like);
  const isShowDisLike = !isHide(disLike);
  const isShowFlush = !isHide(refresh);
  const isShowCopy = !isHide(copy);
  const isShowService =!isHide(service);
  const showFooter = !isWechat && !!(isShowLike || isShowDisLike || isShowFlush || isShowCopy);
  const params = {
    detail: props,
    chatAiRef,
  }
  const isComplete = props?.status === 'complete';
  
  // 获取当前反馈状态，并判断是否展示点赞或点踩样式
  const feedbackState = useFeedbackState();
  
  return (
    <div className={PREFIX}>
      <div ref={props?.containerRef}></div>
      {showFooter && isComplete && <div className={MESSAGE_FOOTER}>
        <span className={`${MESSAGE_FOOTER}-left`}>
          {isShowCopy ? <span className={MESSAGE_ICON} title="复制" onClick={() => handleCopy({...params, type: 'copy', handler: copy?.onClick})}>{copy?.icon || copyIcon}</span> : ''}
          {isShowFlush ? <span className={MESSAGE_ICON} title="重新生成" onClick={() => handleFlush({...params, type: 'refresh', handler: refresh?.onClick})}>{refresh?.icon || flushIcon}</span> : ''}
          {isShowLike ? <span className={MESSAGE_ICON} title="点赞" onClick={() => logger({...params, type: 'like', handler: like?.onClick})}>
            {feedbackState.like ? (like?.icon || likedIcon) : (like?.icon || likeIcon)}
          </span> : ''}
          {isShowDisLike ?<span className={MESSAGE_ICON} title="点踩" onClick={() => logger({...params, type: 'disLike', handler: disLike?.onClick})}>
            {feedbackState.disLike ? (disLike?.icon || disLikedIcon) : (disLike?.icon || disLikeIcon)}
          </span> : ''}
          {isShowService ?<span className={MESSAGE_ICON} title="客服" onClick={() => handleService({...params, type: 'service', handler: service?.onClick})} >{service?.icon || serviceIcon}</span> : ''}
        </span>
        <span className={`${MESSAGE_FOOTER}-right`}>
        </span>
      </div>}
    </div>
  )
}

export default reRenderResponse;