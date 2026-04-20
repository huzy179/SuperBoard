import grpc
from concurrent import futures
import ai_service_pb2
import ai_service_pb2_grpc
from services.gemini_service import gemini_service
import json
from services.training_hub import training_hub

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

    def LogSignal(self, request, context):
        print(f"Logging signal: {request.intent}")
        try:
            payload = json.loads(request.payload_json)
            context_data = json.loads(request.context_json)
            success = gemini_service.log_signal(request.intent, payload, context_data)
            return ai_service_pb2.SignalResponse(success=success)
        except Exception as e:
            print(f"Signal logging failed: {str(e)}")
            return ai_service_pb2.SignalResponse(success=False)

    def ArchitectProject(self, request, context):
        print(f"Architecting project for goal: {request.goal[:30]}...")
        project_data = gemini_service.architect_project(request.goal)
        return ai_service_pb2.ArchitectResponse(project_json=json.dumps(project_data, ensure_ascii=False))

    def GenerateTrainingDataset(self, request, context):
        print(f"Generating training dataset in format: {request.format}")
        dataset_json = training_hub.generate_llama3_dataset(request.limit)
        return ai_service_pb2.DatasetResponse(dataset_jsonl=dataset_json)

def start_grpc_server() -> None:
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    ai_service_pb2_grpc.add_AIServiceServicer_to_server(AIServiceServicer(), server)
    server.add_insecure_port('[::]:50051')
    print("gRPC server started on port 50051")
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    start_grpc_server()
