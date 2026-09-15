import { message as staticMessage } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';

let messageApi: MessageInstance | null = null;

export function setAppMessage(api: MessageInstance) {
  messageApi = api;
}

function getImpl(): MessageInstance {
  return (messageApi ?? staticMessage) as unknown as MessageInstance;
}

export const appMessage: MessageInstance = {
  open: (...args: Parameters<MessageInstance['open']>) => getImpl().open(...args),
  success: (...args: Parameters<MessageInstance['success']>) => getImpl().success(...args),
  info: (...args: Parameters<MessageInstance['info']>) => getImpl().info(...args),
  warning: (...args: Parameters<MessageInstance['warning']>) => getImpl().warning(...args),
  error: (...args: Parameters<MessageInstance['error']>) => getImpl().error(...args),
  loading: (...args: Parameters<MessageInstance['loading']>) => getImpl().loading(...args),
  destroy: (...args: Parameters<MessageInstance['destroy']>) => getImpl().destroy(...args),
} as MessageInstance;
