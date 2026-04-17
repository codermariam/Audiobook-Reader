from google import genai
import sys
client = genai.Client()
with open('models_support.txt', 'w') as f:
    for m in client.models.list():
        f.write(f'{m.name}: {m.supported_generation_methods}\n')
