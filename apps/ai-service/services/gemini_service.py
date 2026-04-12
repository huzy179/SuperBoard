import os
import google.generativeai as genai
from typing import Optional

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GOOGLE_AI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def summarize_task(self, title: str, description: Optional[str]) -> str:
        if not self.model:
            return "AI Service is not configured with an API Key."
        
        prompt = f"""
        Tóm tắt công việc sau đây một cách ngắn gọn súc tích trong 3-4 dòng:
        Tiêu đề: {title}
        Mô tả: {description or 'Không có mô tả'}
        
        Yêu cầu:
        1. Nêu rõ mục tiêu chính.
        2. Các hành động cần thực hiện nếu có.
        3. Các rủi ro hoặc điểm cần chú ý nếu có.
        
        Ngôn ngữ: Tiếng Việt.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating summary: {str(e)}"

    def get_embedding(self, text: str) -> list[float]:
        if not self.model:
            # Fallback for when model is not configured
            return [0.0] * 768
        
        try:
            result = genai.embed_content(
                model='models/text-embedding-004',
                content=text,
                task_type="retrieval_query"
            )
            return result['embedding']
        except Exception as e:
            print(f"Error generating embedding: {str(e)}")
            return [0.0] * 768

    def process_text(self, text: str, mode: str) -> str:
        if not self.model:
            return "AI Service is not configured."
        
        instruction = "Cải thiện văn bản sau"
        if mode == "shorten":
            instruction = "Rút gọn văn bản sau một cách súc tích mà vẫn giữ đủ ý chính"
        elif mode == "summarize":
            instruction = "Tóm tắt ngắn gọn các ý quan trọng nhất của văn bản sau"

        prompt = f"{instruction}:\n\n{text}\n\nNgôn ngữ: Tiếng Việt."
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error processing text: {str(e)}"

    def summarize_chat(self, messages: list[dict]) -> str:
        if not self.model or not messages:
            return "No messages to summarize or AI not configured."
        
        chat_history = "\n".join([f"{m['author']}: {m['content']}" for m in messages])
        prompt = f"""
        Tóm tắt cuộc hội thoại sau đây một cách ngắn gọn, nêu bật các quyết định hoặc nội dung chính:
        
        {chat_history}
        
        Yêu cầu:
        1. Ai đã nói gì quan trọng?
        2. Các quyết định hoặc hành động đã thống nhất là gì?
        
        Ngôn ngữ: Tiếng Việt.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error summarizing chat: {str(e)}"

# Singleton instance
gemini_service = GeminiService()
