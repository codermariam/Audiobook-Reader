import base64
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

app = FastAPI(title="Emotional Audiobook Reader API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the Gemini GenAI client
# Ensure that GEMINI_API_KEY environment variable is set
try:
    client = genai.Client()
except Exception as e:
    print(f"Warning: Failed to initialize genai.Client: {e}")
    client = None

class AudioRequest(BaseModel):
    text: str
    emotion: str
    accent: str

def chunk_text(text: str, max_chars: int = 1500) -> list[str]:
    """
    Splits text into chunks of maximum max_chars characters without breaking sentences.
    """
    import re
    # Split text by sentence boundaries roughly
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

@app.post("/generate-audio")
async def generate_audio(request: AudioRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini client is not initialized. Please set GEMINI_API_KEY.")
        
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text payload is empty.")

    chunks = chunk_text(request.text)
    combined_audio_bytes = bytearray()
    
    # We'll use gemini-2.0-flash as it supports native audio output with the python SDK
    for chunk in chunks:
        prompt = (
             f"You are an expert audiobook narrator. "
             f"Read the following text strictly word-for-word, and perform the narration "
             f"with a {request.emotion} emotional tone and a {request.accent} accent.\n\n"
             f"Text:\n{chunk}"
        )
        
        try:
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                ),
            )
            
            chunk_audio_bytes = None
            if hasattr(response, "candidates") and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, "content") and candidate.content.parts:
                    for part in candidate.content.parts:
                        # Extract the audio inline data payload from the response parts
                        if part.inline_data:
                            if part.inline_data.data:
                                chunk_audio_bytes = part.inline_data.data
                                break
                                
            if chunk_audio_bytes:
                 combined_audio_bytes.extend(chunk_audio_bytes)
                 
        except Exception as e:
            print(f"Error during Gemini API call for chunk: {e}")
            
    if not combined_audio_bytes:
        raise HTTPException(status_code=500, detail="Could not generate audio content. Check prompts and API limits.")
        
    return {
        "audio_base64": base64.b64encode(combined_audio_bytes).decode("utf-8"),
        "mime_type": "audio/mp3" 
    }
