import os
from .llm_provider import GeminiProvider, OllamaProvider, BaseLLMProvider
from .signal_logger import signal_logger
from typing import Optional, List, Dict, Any

class AIServiceLogic:
    def __init__(self):
        # Choose provider based on environment
        provider_type = os.getenv("AI_PROVIDER", "gemini").lower()
        api_key = os.getenv("GOOGLE_AI_API_KEY")
        ollama_model = os.getenv("OLLAMA_MODEL", "llama3")
        ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")

        if provider_type == "ollama":
            self.provider: BaseLLMProvider = OllamaProvider(model_name=ollama_model, base_url=ollama_url)
            print(f"Neural Core: Local intelligence active via Ollama ({ollama_model})")
        elif api_key:
            self.provider: BaseLLMProvider = GeminiProvider(api_key)
            print("Neural Core: Cloud intelligence active via Gemini")
        else:
            self.provider = None
            print("Neural Core: Warning - No AI provider configured")

    def _ensure_provider(self):
        if not self.provider:
            raise Exception("AI Provider not configured. Set GOOGLE_AI_API_KEY or USE_LOCAL_AI=true")

    def summarize_task(self, task_id: str, content: str) -> str:
        self._ensure_provider()
        prompt = f"""
        Tóm tắt công việc sau đây một cách ngắn gọn súc tích trong 3-4 dòng:
        {content}
        
        Yêu cầu:
        1. Nêu rõ mục tiêu chính.
        2. Các hành động cần thực hiện.
        3. Các rủi rro hoặc điểm cần chú ý.
        
        Ngôn ngữ: Tiếng Việt.
        """
        result = self.provider.generate_text(prompt)
        
        # Log the signal
        signal_logger.log_interaction("SUMMARIZE_TASK", {"task_id": task_id, "content": content}, result)
        
        return result

    def get_embedding(self, text: str) -> List[float]:
        self._ensure_provider()
        result = self.provider.get_embedding(text)
        return result

    def process_text(self, text: str, mode: str) -> str:
        self._ensure_provider()
        instruction = "Cải thiện văn bản sau"
        if mode == "shorten":
            instruction = "Rút gọn văn bản sau một cách súc tích mà vẫn giữ đủ ý chính"
        elif mode == "summarize":
            instruction = "Tóm tắt ngắn gọn các ý quan trọng nhất của văn bản sau"
        elif mode == "decompose":
             instruction = "Phân tách mục tiêu sau đây thành danh sách 5-8 nhiệm vụ cụ thể. Trả về dưới dạng JSON array các chuỗi (strings)."

        prompt = f"{instruction}:\n\n{text}\n\nNgôn ngữ: Tiếng Việt."
        
        if mode == "decompose":
            res_json = self.provider.generate_json(prompt)
            result = str(res_json) # Simplified for now
        else:
            result = self.provider.generate_text(prompt)
        
        signal_logger.log_interaction(f"PROCESS_TEXT:{mode.upper()}", {"text": text}, result)
        return result

    def summarize_chat(self, messages: List[Dict[str, Any]]) -> str:
        self._ensure_provider()
        chat_history = "\n".join([f"{m['author']}: {m['content']}" for m in messages])
        prompt = f"""
        Tóm tắt cuộc hội thoại sau đây, nêu bật các quyết định hoặc nội dung chính:
        {chat_history}
        
        Ngôn ngữ: Tiếng Việt.
        """
        result = self.provider.generate_text(prompt)
        signal_logger.log_interaction("SUMMARIZE_CHAT", {"message_count": len(messages)}, result)
        return result

    def generate_automation_rule(self, user_prompt: str) -> str:
        self._ensure_provider()
        # simplified for brevity, maintaining logic from previous implementation
        prompt = f"Convert to Automation Rule JSON: {user_prompt}"
        res_json = self.provider.generate_json(prompt)
        import json
        result = json.dumps(res_json)
        signal_logger.log_interaction("GENERATE_RULE", {"prompt": user_prompt}, result)
        return result

    def architect_project(self, goal: str, image_base64: Optional[str] = None) -> Dict[str, Any]:
        """High-impact feature: Generate full project structure from goal + optional image seed"""
        self._ensure_provider()
        
        prompt = f"""
        Bạn là một Mission Architect, chuyên gia phân tích mục tiêu và thiết kế quy trình làm việc chuyên nghiệp trên Jira.
        Mục tiêu của người dùng: {goal}
        
        { "Ảnh đính kèm là tài liệu tham khảo cho mục tiêu này (ví dụ: wireframe, sketch, diagram)." if image_base64 else "" }
        
        Hãy phân tích và trả về cấu trúc dự án tối ưu dưới dạng JSON.
        Cấu trúc JSON yêu cầu:
        {{
          "suggested_statuses": [
            {{ "name": "Tên trạng thái", "category": "todo|in_progress|done|blocked" }}
          ],
          "tasks": [
            {{
              "title": "Tiêu đề nhiệm vụ",
              "description": "Mô tả chi tiết và các tiêu chí hoàn thành",
              "priority": "low|medium|high|urgent",
              "type": "task|bug|story|epic"
            }}
          ]
        }}
        
        Yêu cầu:
        1. Statuses phải bao quát được toàn bộ vòng đời của mục tiêu.
        2. Tasks phải cụ thể, có thể thực hiện được ngay. Nếu có ảnh, hãy phân tích các thành phần trong ảnh để bóc tách task.
        3. Ngôn ngữ: Tiếng Việt.
        """
        
        import json
        import base64
        
        if image_base64:
            # Multi-modal path
            try:
                # Basic cleanup of data URL prefix if present
                if "," in image_base64:
                    image_base64 = image_base64.split(",")[1]
                
                image_bytes = base64.b64decode(image_base64)
                raw_result = self.provider.generate_with_image(prompt, image_bytes)
                # Cleanup markdown and parse JSON
                json_str = raw_result.strip().replace("```json", "").replace("```", "")
                result = json.loads(json_str)
            except Exception as e:
                print(f"Vision processing failed, falling back to text: {str(e)}")
                result = self.provider.generate_json(prompt)
        else:
            # Text-only path
            result = self.provider.generate_json(prompt)
        
        # Log the signal
        signal_logger.log_interaction("ARCHITECT_PROJECT", {"goal": goal, "has_image": bool(image_base64)}, json.dumps(result, ensure_ascii=False))
        
        return result

    def log_signal(self, intent: str, payload: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """Explicit signal logging for external events (Telemetry)"""
        signal_logger.log_interaction(intent, payload, None, context)
        return True

# Singleton instance
gemini_service = AIServiceLogic()
