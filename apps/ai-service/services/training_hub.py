import json
import os
from typing import List, Dict, Any

class TrainingHub:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.signals_file = os.path.join(data_dir, "signals.jsonl")

    def generate_llama3_dataset(self, limit: int = 1000) -> str:
        """
        Convert signals to Llama-3 instruction format (messages).
        """
        if not os.path.exists(self.signals_file):
            return "[]"

        dataset = []
        count = 0
        
        try:
            with open(self.signals_file, "r", encoding="utf-8") as f:
                for line in f:
                    if count >= limit:
                        break
                    
                    signal = json.loads(line)
                    # Quality Check: Only log signals with actual output
                    if not signal.get("output"):
                        continue
                    
                    # Convert to Llama-3 Messages format
                    entry = {
                        "messages": [
                            {"role": "system", "content": f"You are a SuperBoard AI assistant. Intention: {signal.get('intent', 'general')}"},
                            {"role": "user", "content": str(signal.get("input", ""))},
                            {"role": "assistant", "content": str(signal.get("output", ""))}
                        ]
                    }
                    dataset.append(entry)
                    count += 1
        except Exception as e:
            print(f"Error generating dataset: {str(e)}")
            return "[]"

        return json.dumps(dataset, ensure_ascii=False)

# Singleton
training_hub = TrainingHub()
