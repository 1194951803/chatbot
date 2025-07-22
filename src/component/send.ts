import { StreamSend, StreamingAdapterObserver } from '@nlux/react';
import { SetStateAction, useRef } from 'react';
import { trimEnd } from 'lodash';

sessionStorage.removeItem('chatRequestId');
sessionStorage.removeItem('chatSessionId');

type StopFunction = () => void;
let reader: ReadableStreamDefaultReader<Uint8Array>;

// 将从服务器接收到的分块数据解析为可用的文本和会话 ID，适用于处理流式数据的场景。通过分割、解析和错误处理，确保能够正确提取所需的信息。
function defaultProcessChunk(chunks: string) {
    let result = '';
    let sessionId = null;
    let requestId = null;

    chunks.split("\nid").forEach(chunk => {
      let data: any = chunk.split('HTTP_STATUS/200\ndata:')[1];
      try {
        data = JSON.parse(data);
        requestId = data.request_id;
        sessionId = data.output.session_id;
        result += data.output.text || '';
      } catch (e) {
        throw(e);
      }
    });
    return [result, requestId, sessionId];
}
export const createSend = function(setStopFunctionVisible: { (value: SetStateAction<boolean>): void }): [StreamSend, StopFunction, () => boolean] {
    // 用于判断是否正在生成中
    const isStreamingRef = useRef(false);
    // 用于保存observer用于停止时发送提示信息
    const observerRef = useRef<StreamingAdapterObserver | null>(null);

    const getIsStreaming = () => {
        return isStreamingRef.current;
    }

    const stopGenerating: StopFunction = () => {
        if (reader) {
            // 确保 observerRef.current 是一个有效的对象，并且具有 next 方法
            if (observerRef.current && typeof observerRef.current.next === 'function') {
                observerRef.current.next("\n您已终止会话请求。");
                // 新增 complete 调用
                if (typeof observerRef.current.complete === 'function') {
                    observerRef.current.complete();
                }
            }
            reader.cancel();
            isStreamingRef.current = false;
        } 
    };

    return [async (
        prompt: string,
        observer: StreamingAdapterObserver,
    ) => {
        // 响应时标记为正在生成中
        isStreamingRef.current = true;
        // 保存observer用于停止时发送提示信息
        observerRef.current = observer;
        
        // 插件扩展点 - 在发送请求前重写 prompt。
        if (window.CHATBOT_CONFIG.dataProcessor?.rewritePrompt) {
            prompt = window.CHATBOT_CONFIG.dataProcessor.rewritePrompt(prompt);
        }
        // 扩展微信客服展示二维码
        if (prompt.includes('人工客服')) {
            observer.next('#### 请扫描下方二维码联系人工客服 \n' + '<img width="100" height="100" src="http://www.hjhrcloud.com/assets/images/wxkf.png" />');
            // 添加延时，确保二维码展示在消息框中
            setTimeout(() => {
                observer.complete();
            }, 500);
            isStreamingRef.current = false;
            return;
        }
        const body = {
            sessionId: sessionStorage.getItem('chatSessionId'),
            prompt
        };
        const response = await fetch(window.CHATBOT_CONFIG.endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });

        if (response.redirected) {
            observer.next('您的登录状态已过期，请刷新页面后重新登录。')
            observer.complete();
            return;
        }

        if (response.status !== 200) {
            observer.next('连接服务器失败');
            observer.complete();
            return;
        }

        if (!response.body) {
            return;
        }
        
        // Read a stream of server-sent events
        // and feed them to the observer as they are being generated
        reader = response.body.getReader();
        // const textDecoder = new TextDecoder();
        const textDecoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
        let preContent = '';
        while (true) {
            const {value, done} = await reader.read();
            
            if (!done) {
                setStopFunctionVisible(true);
            }
            if (done) {
                break;
            }

            let content = textDecoder.decode(value);
            
            // reader.read()读取流数据可能读取到不完整的返回数据导致json解析失败，如果失败先存起来，后续连接新读取的内容做解析
            if (!trimEnd(content).endsWith('}')) {
                preContent = preContent + content;
                continue;
            } 
 
            if (preContent != '') {
                content = preContent + content;
                preContent = '';
            }

            if (content) {
                const processChunk = window.CHATBOT_CONFIG.dataProcessor?.processChunk || defaultProcessChunk;
                try {
                    const [text, requestId, sessionId] = processChunk(content);
                    sessionStorage.setItem('chatSessionId', (sessionId || ''));
                    sessionStorage.setItem('chatRequestId', (requestId || ''));
                    text && observer.next(text);
                } catch (e) {
                    console.warn('内容解析失败: ' + content, e);
                    observer.next('\n内容解析失败');
                }
            }
        }
        setStopFunctionVisible(false);
        isStreamingRef.current = false;
        observer.complete();
    }, stopGenerating, getIsStreaming];
}
