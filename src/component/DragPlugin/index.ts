interface Props {
  visible?: boolean | undefined;
  domElement: HTMLElement | null;
  dialogElement: HTMLElement | null;
  toggleChatBox?: () => void;
  bubbleImage?: string | undefined,
}

/**
 * 拖拽插件
 */
class AiChatDragPlugin {
  private handleClick: any;
  private visible: boolean | undefined;
  private draggable: boolean | undefined;
  private domElement: HTMLElement | null;
  private dialogElement: HTMLElement | null;
  private isDragging: boolean;
  private threshold: number;
  private startX: number;
  private startY: number;
  // private originBubbleImage: string | undefined;

  constructor(props: Props) {
    this.visible = props.visible;
    this.handleClick = props.toggleChatBox;
    this.draggable = window.CHATBOT_CONFIG?.draggable;
    // this.originBubbleImage = props?.bubbleImage;
    this.domElement = props.domElement;
    this.dialogElement = props.dialogElement;
    this.isDragging = false;
    // 阈值，用于判断是否拖动
    this.threshold = 5;
    this.startX = 0;
    this.startY = 0;
  }

  /**
   * 约束元素在视口内
   */
  private constrainToViewport = () => {
    if (!this.domElement) return;
    const rect = this.domElement.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;
    if (rect.right > innerWidth) {
      this.domElement.style.right = `0px`;
    }

    if (rect.bottom > innerHeight) {
      this.domElement.style.bottom = `0px`;
    }

    if (rect.x < 0) {
      this.domElement.style.right = `${innerWidth - rect.width}px`;
    }

    if (rect.y < 0) {
      this.domElement.style.bottom = `${innerHeight - rect.height}px`;
    }
  }

  /**
   * 开始拖拽
   * @param e
   */
  private handleMouseDown = (e: MouseEvent) => {
    if (!this.domElement) return;
    this.isDragging = false;
    // 记录初始位置
    this.startX = e.clientX;
    this.startY = e.clientY;
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.onselectstart = () => false; // 拖拽时禁用选中文本
  }

  /**
   * 拖拽
   * @param e
   */
  private handleMouseMove = (e: MouseEvent) => {
    if (!this.domElement) return;
    // 判断是否 拖拽 | 点击事件
    if (!this.isDragging) {
      const dx = Math.abs(e.clientX - this.startX);
      const dy = Math.abs(e.clientY - this.startY);
      const isDragging = dx >= this.threshold || dy >= this.threshold;
      if (isDragging && !this.visible) {
        this.isDragging = true;
        this.domElement.style.cursor = 'grabbing';
      }
    }
    if (this.isDragging) {
      e.preventDefault();
      const { innerHeight, innerWidth } = window;
      const { width, height } = this.domElement.getBoundingClientRect();
      this.domElement.style.bottom = `${innerHeight - e.clientY - height / 2}px`;
      this.domElement.style.right = `${innerWidth - e.clientX - width / 2}px`;
    }
  }

  /**
   * 非拖拽而是点击事件
   * @returns
   */
  private handleToggleClick = () => {
    if (!this.handleClick || !this.domElement) return;
    if (!this.visible) {
      // 即将打开弹窗
      if (this.dialogElement) {
        const { innerHeight, innerWidth } = window;
        const { left, top } = this.domElement.getBoundingClientRect();
        this.dialogElement.style.bottom = `${innerHeight - top}px`;
        this.dialogElement.style.right = `${innerWidth - left}px`;
      }
    }
    if (this.visible){
      // 即将关闭弹窗
      if (this.dialogElement) {
        this.dialogElement.style.right = '10px';
        this.dialogElement.style.bottom = '10px';
      }
      // this.domElement.style.backgroundImage = `url(${this.originBubbleImage})`;
    }
    this.handleClick();
  }

  /**
   * 结束拖拽
   */
  private handleMouseUp = () => {
    if (!this.domElement) return;
    // 点击事件
    if (!this.isDragging) {
      this.handleToggleClick();
    }
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    if (this.isDragging) {
      this.isDragging = false;
      this.domElement.style.cursor = 'pointer';
      this.constrainToViewport();
    }
    document.onselectstart = null;
  }

  /**
   * 初始化
   */
  public init = () => {
    if (!this.domElement || !this.draggable) return;
    this.domElement.addEventListener('mousedown', this.handleMouseDown);
  }

  /**
   * 销毁
   */
  public destroy = () => {
    if (!this.domElement || !this.draggable) return;
    this.domElement.removeEventListener('mousedown', this.handleMouseDown);
  }
}

export default AiChatDragPlugin;
