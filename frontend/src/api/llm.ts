import http from './index'

export const llmApi = {
  // 医护端 LLM 对话（需要登录）
  chat: (data: { messages: Array<{ role: string; content: string }>; temperature?: number; max_tokens?: number }, config?: any) =>
    http.post('/llm/chat', data, config),

  // 患者端 LLM 对话（公开接口，不需要登录）
  patientChat: (data: { messages: Array<{ role: string; content: string }>; temperature?: number; max_tokens?: number }, config?: any) =>
    http.post('/llm/public/chat', data, config),
}
