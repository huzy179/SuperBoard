from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any

class BaseLLMProvider(ABC):
    @abstractmethod
    def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        pass

    @abstractmethod
    def get_embedding(self, text: str) -> List[float]:
        pass

    @abstractmethod
    def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        pass

    @abstractmethod
    def generate_with_image(self, prompt: str, image_bytes: bytes, mime_type: str = "image/png") -> str:
        pass

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        try:
            # Combine system prompt if provided
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            return f"Error: {str(e)}"

    def generate_with_image(self, prompt: str, image_bytes: bytes, mime_type: str = "image/png") -> str:
        try:
            response = self.model.generate_content([
                prompt,
                { "mime_type": mime_type, "data": image_bytes }
            ])
            return response.text
        except Exception as e:
            return f"Vision Error: {str(e)}"

    def get_embedding(self, text: str) -> List[float]:
        import google.generativeai as genai
        try:
            result = genai.embed_content(
                model='models/text-embedding-004',
                content=text,
                task_type="retrieval_query"
            )
            return result['embedding']
        except Exception as e:
            print(f"Embedding error: {str(e)}")
            return [0.0] * 768

    def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        import json
        text = self.generate_text(prompt, system_prompt)
        try:
            # Simple cleanup for potential markdown
            json_str = text.strip().replace("```json", "").replace("```", "")
            return json.loads(json_str)
        except Exception as e:
            print(f"JSON parsing error: {str(e)}")
            return {"error": "Failed to parse AI response as JSON", "raw": text}

class OllamaProvider(BaseLLMProvider):
    """Functional local provider using Ollama API"""
    def __init__(self, model_name: str = "llama3", base_url: str = "http://localhost:11434"):
        self.model_name = model_name
        self.base_url = base_url
        import requests
        self.session = requests.Session()

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        try:
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "system": system_prompt if system_prompt else "",
                "stream": False
            }
            response = self.session.post(f"{self.base_url}/api/generate", json=payload)
            response.raise_for_status()
            return response.json().get("response", "")
        except Exception as e:
            return f"Ollama Error: {str(e)}. Ensure Ollama is running and '{self.model_name}' is pulled."

    def get_embedding(self, text: str) -> List[float]:
        try:
            payload = {
                "model": self.model_name,
                "prompt": text
            }
            response = self.session.post(f"{self.base_url}/api/embeddings", json=payload)
            response.raise_for_status()
            return response.json().get("embedding", [0.0] * 768)
        except Exception as e:
            print(f"Ollama Embedding Error: {str(e)}")
            return [0.0] * 768

    def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        import json
        try:
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "system": system_prompt if system_prompt else "",
                "format": "json",
                "stream": False
            }
            response = self.session.post(f"{self.base_url}/api/generate", json=payload)
            response.raise_for_status()
            return json.loads(response.json().get("response", "{}"))
        except Exception as e:
            print(f"Ollama JSON Error: {str(e)}")
            return {"error": str(e)}

    def generate_with_image(self, prompt: str, image_bytes: bytes, mime_type: str = "image/png") -> str:
        return "Error: Local Ollama provider currently does not support vision seeds. Please switch to Gemini for multimodal synthesis."
