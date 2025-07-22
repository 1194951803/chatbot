import { rightArrow } from "../icon/svgIcons";

import './index.css';

/**
 * 居中布局的欢迎页面
 * @param params 
 * @returns 
 */
const Greeting = (params: any) => {
  const { options, api, greetingOptions } = params || {};
  const welComeIcon = options?.personaOptions?.assistant?.avatar;
  const quickList = options?.conversationOptions?.conversationStarters || [];
  const { greeting = '我能帮您做点什么?', name = '你好, 我是数智员工小宏', quickStartItemClick } = greetingOptions || {};

  return (
    <div className='initial-greeting'>
      <div className='greeting-container'>
        <div>
          <div className='greeting-icon' style={{ backgroundImage: `url(${welComeIcon})` }}></div>
        </div>
        <div className='greeting-text greeting-text-name'>{name}</div>
        <div className='greeting-text greeting-text-hello'>{greeting}</div>
      </div>
      <div className='greeting-quick-start'>
        {quickList.map((item: any, index: number) => {
          if (!item?.prompt) return '';
          return (
            <div key={`quick-start-${index}`} className='quick-start-item' onClick={() => {
              if (typeof quickStartItemClick === 'function') {
                quickStartItemClick({
                  item,
                  api,
                });
              } else {
                api?.composer && api.composer.send(item?.prompt);
              }
            }}>
              <span>{item?.prompt}</span>
              <i>{rightArrow}</i>
            </div>
          )
        })?.filter?.((i: any) => i)}
      </div>
      <div className='custom-buttons-container'>
        {/* <button className='custom-button wechat' onClick={() => {api?.composer && api.composer.send('微信客服')}}>
          微信客服
        </button> */}
      </div>
    </div>
  )
}

export default Greeting;