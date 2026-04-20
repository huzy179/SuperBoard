import json
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
SIGNALS_FILE = BASE_DIR / "data" / "signals.jsonl"
OUTPUT_FILE = BASE_DIR / "data" / "training_dataset.json"

def transform_signal_to_alpaca(signal):
    """
    Transforms a single telemetry signal into an Alpaca-formatted instruction triplet.
    Format: { "instruction": "...", "input": "...", "output": "..." }
    """
    intent = signal.get("intent")
    payload = signal.get("payload", {})
    response = signal.get("response")
    context = signal.get("context", {})

    if intent == "SUMMARIZE_TASK":
        return {
            "instruction": "Tóm tắt nội dung công việc sau đây một cách súc tích và nêu bật các hành động chính.",
            "input": payload.get("content", ""),
            "output": response
        }
    
    if intent == "MISSION_EXECUTED":
        # We find the matching synthesis interaction for this deployment
        # For simplicity in this version, we assume the goal is in the payload
        return {
            "instruction": "Hãy phân tách mục tiêu chiến lược sau đây thành các nhiệm vụ cụ thể để triển khai trên Jira.",
            "input": payload.get("goal", "N/A"),
            "output": f"Dựa trên mục tiêu của bạn, tôi đề xuất các nhiệm vụ sau: {payload.get('tasks', [])}"
        }

    if intent.startswith("PROCESS_TEXT"):
        mode = intent.split(":")[-1]
        instruction = "Xử lý văn bản sau."
        if mode == "SHORTEN":
            instruction = "Hãy rút gọn văn bản sau mà vẫn giữ nguyên ý chính."
        elif mode == "SUMMARIZE":
            instruction = "Hãy tóm tắt các điểm quan trọng nhất của đoạn văn này."
        
        return {
            "instruction": instruction,
            "input": payload.get("text", ""),
            "output": response
        }

    return None

def main():
    if not SIGNALS_FILE.exists():
        print(f"Error: {SIGNALS_FILE} not found. Start logging some signals first!")
        return

    print(f"Processing signals from {SIGNALS_FILE}...")
    dataset = []
    
    with open(SIGNALS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            try:
                signal = json.loads(line.strip())
                example = transform_signal_to_alpaca(signal)
                if example and example.get("output"):
                    dataset.append(example)
            except Exception as e:
                print(f"Skipping malformed line: {e}")

    if dataset:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(dataset, f, ensure_ascii=False, indent=2)
        print(f"Success! {len(dataset)} examples exported to {OUTPUT_FILE}")
        print("You can now use this file to fine-tune your local Llama model.")
    else:
        print("No valid training examples found in signals. Signal stream is currently too low for synthesis.")

if __name__ == "__main__":
    main()
