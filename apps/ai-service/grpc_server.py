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

def start_grpc_server() -> None:
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    ai_service_pb2_grpc.add_AIServiceServicer_to_server(AIServiceServicer(), server)
    server.add_insecure_port('[::]:50051')
    print("gRPC server started on port 50051")
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    start_grpc_server()
