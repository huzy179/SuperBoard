"""
Enrichment actions triggered by domain events from the Event Bus.
Requirements: 13.1
"""
import logging
from typing import Any

logger = logging.getLogger(__name__)


def _get_logger(correlation_id: str) -> logging.LoggerAdapter:
    return logging.LoggerAdapter(logger, {"correlation_id": correlation_id})


async def enrich_task_created(payload: dict[str, Any], correlation_id: str = "unknown") -> None:
    """
    Triggered when task.created event is received.
    Actions: summarize task content + suggest labels.
    """
    log = _get_logger(correlation_id)
    task_id = payload.get("taskId", "unknown")
    log.info(f"[enrichment] enrich_task_created: task_id={task_id}")

    # Summarize task title/description
    title = payload.get("title", "")
    if title:
        log.info(f"[enrichment] summarize task title for task_id={task_id}")
        # TODO: call gemini_service.summarize_task(task_id, title) when integrated

    # Suggest labels based on task content
    log.info(f"[enrichment] suggest labels for task_id={task_id}")
    # TODO: call gemini_service.suggest_labels(task_id, title) when integrated


async def enrich_task_updated(payload: dict[str, Any], correlation_id: str = "unknown") -> None:
    """
    Triggered when task.updated event is received.
    Actions: re-score task priority/relevance.
    """
    log = _get_logger(correlation_id)
    task_id = payload.get("taskId", "unknown")
    log.info(f"[enrichment] enrich_task_updated: task_id={task_id}")

    changes = payload.get("changes", {})
    log.info(f"[enrichment] re-score task_id={task_id} with changes={list(changes.keys())}")
    # TODO: call gemini_service.score_task(task_id, changes) when integrated


async def enrich_doc_updated(payload: dict[str, Any], correlation_id: str = "unknown") -> None:
    """
    Triggered when doc.updated event is received.
    Actions: summarize document content.
    """
    log = _get_logger(correlation_id)
    doc_id = payload.get("docId", "unknown")
    log.info(f"[enrichment] enrich_doc_updated: doc_id={doc_id}")

    change_type = payload.get("changeType", "content")
    if change_type == "content":
        log.info(f"[enrichment] summarize doc_id={doc_id} after content change")
        # TODO: call gemini_service.summarize_doc(doc_id) when integrated
    else:
        log.info(f"[enrichment] skipping summarize for doc_id={doc_id}, change_type={change_type}")
