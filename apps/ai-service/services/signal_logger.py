import json
import os
from datetime import datetime, timezone
from typing import Any, Dict

class SignalLogger:
    def __init__(self, log_dir: str = "data"):
        self.log_dir = log_dir
        self.log_file = os.path.join(log_dir, "signals.jsonl")
        
        # Ensure directory exists
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)

    def log_interaction(self, intent: str, input_data: Any, output_data: Any, context: Dict[str, Any] = None):
        """
        Record a single interaction signal for future fine-tuning.
        """
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "intent": intent,
            "input": input_data,
            "output": output_data,
            "context": context or {}
        }
        
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(payload, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"Error logging signal: {str(e)}")

# Singleton instance
signal_logger = SignalLogger()
