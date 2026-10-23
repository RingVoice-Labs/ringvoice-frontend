import asyncio
import datetime
import logging
import random
import uuid
from typing import List, Optional
from .websocket_manager import manager
from ..database import SessionLocal
from ..models import VisitModel, CaptionChunkModel
from ..schemas import CaptionChunk

logger = logging.getLogger("ringvoice.stt")

SAMPLE_DIALOGUES = [
    "Hello? Is anyone home? I have a delivery package that requires a signature. I can leave it near the door if you'd like.",
    "Hi there! Just dropping off the parcel from Amazon. It's tucked behind the planter by the front steps.",
    "Good afternoon! I'm from the neighborhood watch committee, just checking in to share our monthly safety newsletter.",
    "Hey! It's Sarah from next door. Just wanted to see if you have an extra cup of sugar before I start baking.",
    "Courier placing express envelope into the mailbox. All set, have a great day!"
]

def chunk_sentence(text: str) -> List[dict]:
    """
    Splits text into realistic speech chunks with `isFinal` sentence boundaries.
    Chunks mimic natural human speech cadence (1-3 words per chunk).
    """
    sentences = [s.strip() for s in text.replace("?", "?|").replace("!", "!|").replace(".", ".|").split("|") if s.strip()]
    all_chunks = []
    
    for s_idx, sentence in enumerate(sentences):
        words = sentence.split()
        if not words:
            continue
            
        i = 0
        while i < len(words):
            # Take 1 to 3 words
            chunk_size = random.choice([1, 2, 3])
            chunk_words = words[i:i + chunk_size]
            is_last_chunk_of_sentence = (i + chunk_size) >= len(words)
            chunk_text = " ".join(chunk_words)
            
            # If not the end of the sentence, do not append punctuation if present
            all_chunks.append({
                "text": chunk_text,
                "is_final": is_last_chunk_of_sentence
            })
            i += chunk_size
            
    return all_chunks

class STTService:
    def __init__(self):
        self._active_sessions = set()

    async def stream_transcription_for_visit(
        self,
        visit_id: str,
        dialogue: Optional[str] = None,
        delay_before_start: float = 1.0,
        chunk_interval_ms: int = 350
    ):
        """
        Asynchronously streams transcription chunks to connected WebSocket clients
        and persists them into SQLite database for the visit record.
        """
        if visit_id in self._active_sessions:
            logger.warning(f"STT stream already active for visit {visit_id}")
            return
            
        self._active_sessions.add(visit_id)
        
        try:
            # Initial pause before visitor starts speaking
            if delay_before_start > 0:
                await asyncio.sleep(delay_before_start)
                
            selected_text = dialogue or random.choice(SAMPLE_DIALOGUES)
            chunks = chunk_sentence(selected_text)
            
            db = SessionLocal()
            try:
                for idx, item in enumerate(chunks):
                    chunk_id = f"c-{visit_id[-6:]}-{idx + 1}"
                    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
                    
                    chunk_obj = CaptionChunk(
                        id=chunk_id,
                        text=item["text"],
                        timestamp=now_iso,
                        isFinal=item["is_final"],
                        visitId=visit_id
                    )
                    
                    # 1. Broadcast over WebSocket
                    await manager.broadcast_caption_chunk(chunk_obj)
                    
                    # 2. Persist to SQLite
                    db_chunk = CaptionChunkModel(
                        id=chunk_obj.id,
                        visit_id=visit_id,
                        text=chunk_obj.text,
                        timestamp=chunk_obj.timestamp,
                        is_final=chunk_obj.isFinal,
                        chunk_order=idx + 1
                    )
                    db.add(db_chunk)
                    db.commit()
                    
                    # Realistic speech pause between chunks (300ms - 450ms)
                    jitter = random.uniform(0.85, 1.25)
                    await asyncio.sleep((chunk_interval_ms / 1000.0) * jitter)
                
                # Mark session ended
                end_iso = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
                visit_record = db.query(VisitModel).filter(VisitModel.id == visit_id).first()
                if visit_record:
                    visit_record.ended_at = end_iso
                    db.commit()
                    
                # Broadcast session_end frame
                await manager.broadcast_session_end(visit_id, end_iso)
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error in STT stream for visit {visit_id}: {e}", exc_info=True)
            await manager.broadcast_error("STT_ERROR", f"Speech transcription failed: {str(e)}")
        finally:
            self._active_sessions.discard(visit_id)

stt_service = STTService()
