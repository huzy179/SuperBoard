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

# Singleton instance
gemini_service = GeminiService()
