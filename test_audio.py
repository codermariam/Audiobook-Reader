from google import genai
from google.genai import types
import os

client = genai.Client()
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Hello world',
    config=types.GenerateContentConfig(
        response_modalities=['AUDIO'],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name='Puck'
                )
            )
        )
    )
)
print('SUCCESS')
