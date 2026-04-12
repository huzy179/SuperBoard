import grpc
from concurrent import futures
import ai_service_pb2
import ai_service_pb2_grpc
from services.gemini_service import gemini_service

class AIServiceServicer(ai_service_pb2_grpc.AIServiceServicer):
    def SummarizeTask(self, request, context):
        print(f"Summarizing task: {request.task_id}")
        summary = gemini_service.summarize_task(request.task_id, request.content)
        return ai_service_pb2.SummarizeResponse(summary=summary)

    def GetEmbedding(self, request, context):
        print(f"Generating embedding for text: {request.text[:30]}...")
        vec = gemini_service.get_embedding(request.text)
        return ai_service_pb2.EmbeddingResponse(embedding=vec)

    def ProcessText(self, request, context):
        print(f"Processing text in mode: {request.mode}")
        result = gemini_service.process_text(request.text, request.mode)
        return ai_service_pb2.TextResponse(result=result)

    def SummarizeChat(self, request, context):
        print(f"Summarizing chat thread with {len(request.messages)} messages")
        # Convert messages to dicts
        messages = [{"author": m.author, "content": m.content, "created_at": m.created_at} for m in request.messages]
        summary = gemini_service.summarize_chat(messages)
        return ai_service_pb2.TextResponse(result=summary)

    def GenerateAutomationRule(self, request, context):
        print(f"Generating automation rule for prompt: {request.prompt[:30]}...")
        result = gemini_service.generate_automation_rule(request.prompt)
        return ai_service_pb2.TextResponse(result=result)

def start_grpc_server() -> None:
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    ai_service_pb2_grpc.add_AIServiceServicer_to_server(AIServiceServicer(), server)
    server.add_insecure_port('[::]:50051')
    print("gRPC server started on port 50051")
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    start_grpc_server()
