import base64
import os
import tempfile
import io
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
import pypdf
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

app = FastAPI(title="Emotional Audiobook Reader API")

@app.get("/list-models")
async def list_models():
    with open("debug_models.txt", "w") as f:
        for m in client.models.list():
            f.write(f"{m.name}\n")
    return {"status": "written"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the Gemini GenAI client
try:
    client = genai.Client()
except Exception as e:
    print(f"Warning: Failed to initialize genai.Client: {e}")
    client = None

def chunk_text(text: str, max_chars: int = 1500) -> list[str]:
    import re
    sentences = re.split(r'(?<=[.!?]) +', text)
    chunks = []
    current_chunk = ""
    for sentence in sentences:
        if len(current_chunk) + len(sentence) > max_chars:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
        else:
            current_chunk += sentence + " "
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

@app.post("/parse-book")
async def parse_book(file: UploadFile = File(...)):
    """Extracts text from the uploaded file and returns an array of chunks (pages)."""
    extracted_text = ""
    file_bytes = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith(".txt"):
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
        elif filename.endswith(".pdf"):
            pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
        elif filename.endswith(".epub"):
            fd, temp_path = tempfile.mkstemp(suffix=".epub")
            try:
                with os.fdopen(fd, 'wb') as f:
                    f.write(file_bytes)
                book = epub.read_epub(temp_path)
                for item in book.get_items():
                    if item.get_type() == ebooklib.ITEM_DOCUMENT:
                        soup = BeautifulSoup(item.get_body_content(), 'html.parser')
                        extracted_text += soup.get_text() + "\n"
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
        
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Extracted text is empty.")

    chunks = chunk_text(extracted_text, max_chars=1500)
    return {"pages": chunks}

class PageAudioRequest(BaseModel):
    text: str
    emotion: str
    accent: str
    voice: str = "Kore"

@app.post("/generate-page-audio")
async def generate_page_audio(request: PageAudioRequest):
    """Generates audio for a single page snippet."""
    if not client:
        raise HTTPException(status_code=500, detail="Gemini client is not initialized. Please set GEMINI_API_KEY environment variable.")
        
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text payload is empty.")

    prompt = (
         f"You are an expert audiobook narrator. "
         f"Read the following text strictly word-for-word, and perform the narration "
         f"with a {request.emotion} emotional tone and a {request.accent} accent.\n\n"
         f"Text:\n{request.text}"
    )
    
    try:
        response = client.models.generate_content(
            model='gemini-3.1-flash-tts-preview',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=request.voice
                        )
                    )
                )
            ),
        )
        
        audio_bytes = None
        if hasattr(response, "candidates") and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, "content") and candidate.content.parts:
                for part in candidate.content.parts:
                    if part.inline_data and part.inline_data.data:
                        audio_bytes = part.inline_data.data
                        break
                        
        if not audio_bytes:
            raise HTTPException(status_code=500, detail="Gemini response did not contain audio data. Wait a moment before retrying.")
            
        import wave
        import io
        wav_io = io.BytesIO()
        with wave.open(wav_io, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2) # 16-bit
            wav_file.setframerate(24000) # 24kHz standard for Gemini TTS
            wav_file.writeframes(audio_bytes)
            
        wav_bytes = wav_io.getvalue()
            
        return {
            "audio_base64": base64.b64encode(wav_bytes).decode("utf-8"),
            "mime_type": "audio/wav" 
        }
    except Exception as e:
        with open("api_error.log", "w") as f:
            f.write(repr(e))
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {repr(e)}")
