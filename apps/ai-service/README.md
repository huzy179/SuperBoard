# AI Intelligence Service 🤖

Dịch vụ cung cấp các tính năng thông minh dựa trên trí tuệ nhân tạo (AI) cho SuperBoard.

## Công Nghệ Sử Dụng

- **Ngôn ngữ**: Python
- **Framework**: FastAPI
- **Giao thức**: gRPC / REST
- **AI Models**: Tích hợp OpenAI, Gemini hoặc Local LLMs.

## Chức Năng Chính

- **Tóm tắt nội dung**: Tóm tắt các cuộc hội thoại hoặc mô tả task dài.
- **Tìm kiếm ngữ nghĩa**: Tìm kiếm thông tin dựa trên ý nghĩa câu hỏi thay vì chỉ từ khóa.
- **Gợi ý thông minh**: Gợi ý người thực hiện hoặc nhãn dán cho task.

## Cách Chạy

```bash
# Cài đặt môi trường Python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Khởi chạy
uvicorn main:app --reload
```
