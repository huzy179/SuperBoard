import grpc
from concurrent import futures
import ai_service_pb2
import ai_service_pb2_grpc
from services.gemini_service import gemini_service
import json
import logging
from services.training_hub import training_hub

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
)

logger = logging.getLogger(__name__)


def _extract_correlation_id(context) -> str:
    """Extract correlation-id from gRPC invocation metadata."""
    try:
        metadata = dict(context.invocation_metadata())
        return metadata.get('correlation-id', 'unknown')
    except Exception:
        return 'unknown'


class CorrelationLoggerAdapter(logging.LoggerAdapter):
    """Logger adapter that injects correlation_id into every log record."""

    def process(self, msg, kwargs):
        kwargs.setdefault('extra', {})
        kwargs['extra']['correlation_id'] = self.extra.get('correlation_id', 'unknown')
        return msg, kwargs


def get_logger(correlation_id: str) -> CorrelationLoggerAdapter:
    return CorrelationLoggerAdapter(logger, {'correlation_id': correlation_id})


class AIServiceServicer(ai_service_pb2_grpc.AIServiceServicer):
    def SummarizeTask(self, request, context):
        cid = _extract_correlation_id(context)
        log = get_logger(cid)
        log.info(f"Summarizing task: {request.task_id}")
        summary = gemini_service.summarize_task(request.task_id, request.content)
        return ai_service_pb2.SummarizeResponse(summary=summary)

    def GetEmbedding(self, request, context):
        cid = _extract_correlation_id(context)
        log = get_logger(cid)
        log.info(f"Generating embedding for text: {request.text[:30]}...")
        vec = gemini_service.get_embedding(request.text)
        return ai_service_pb2.EmbeddingResponse(embedding=vec)

    def ProcessText(self, request, context):
        cid = _extract_correlation_id(context)
        log = get_logger(cid)
        log.info(f"Processing text in mode: {request.mode}")
        result = gemini_service.process_text(request.text, request.mode)
        return ai_service_pb2.TextResponse(result=result)

    def SummarizeChat(self, request, context):
        cid = _extract_correlation_id(context)
        log = get_logger(cid)
        log.info(f"Summarizing chat thread with {len(request.messages)} messages")
        messages = [{"author": m.author, "content": m.content, "created_at": m.created_at} for m in request.messages]
        summary = gemini_service.summarize_chat(messages)
        return ai_service_pb2.TextResponse(result=summary)

    def GenerateAutomationRule(self, request, context):
        cid = _extract_correlation_id(context)
        log = get_logger(cid)
        log.info(f"Generating automation rule for prompt: {request.prompt[:30]}...")
        result = gemini_service.generate_automation_rule(request.prompt)
        return ai_service_pb2.TextResponse(result=result)

    def LogSignal(self, request, context):
        cid = _extract_correlation_id(context)
        log = get_logger(cid)
        log.info(f"Logging signal: {request.intent}")
        try:
            payload = json.loads(request.payload_json)
            context_data = json.loads(request.context_json)
            success = gemini_service.log_signal(request.intent, payload, context_data)
            return ai_service_pb2.SignalResponse(success=success)
        except Exception as e:
            log.error(f"Signal logging failed: {str(e)}")
            return ai_service_pb2.SignalResponse(success=False)

    def ArchitectProject(self, request, context):
        cid = _extract_correlation_id(context)
        log = get_logger(cid)
        log.info(f"Architecting project for goal: {request.goal[:30]}...")
        project_data = gemini_service.architect_project(request.goal)
        return ai_service_pb2.ArchitectResponse(project_json=json.dumps(project_data, ensure_ascii=False))

    def GenerateTrainingDataset(self, request, context):
        cid = _extract_correlation_id(context)
        log = get_logger(cid)
        log.info(f"Generating training dataset in format: {request.format}")
        dataset_json = training_hub.generate_llama3_dataset(request.limit)
        return ai_service_pb2.DatasetResponse(dataset_jsonl=dataset_json)


def start_grpc_server() -> None:
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    ai_service_pb2_grpc.add_AIServiceServicer_to_server(AIServiceServicer(), server)
    server.add_insecure_port('[::]:50051')
    logging.getLogger(__name__).info(
        "gRPC server started on port 50051",
        extra={'correlation_id': 'startup'},
    )
    server.start()
    server.wait_for_termination()


if __name__ == "__main__":
    start_grpc_server()
