from google import genai
from google.genai import types

client = genai.Client()
response = client.models.generate_content(
    model='gemini-2.5-flash-preview-tts',
    contents='Hello world',
    config=types.GenerateContentConfig(
        response_modalities=['AUDIO'],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name='Puck')
            )
        )
    ),
)
for part in response.candidates[0].content.parts:
    if part.inline_data:
        data = part.inline_data.data
        print('Length:', len(data))
        print('First 10 bytes:', data[:10])
