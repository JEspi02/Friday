from openai import OpenAI

class ScoutAgent:
    def __init__(self):
        self.client = None

    def initialize_client(self, provider: str, api_key: str = None, base_url: str = None):
        if provider == "lm-studio":
            self.client = OpenAI(
                base_url=base_url or "http://localhost:1234/v1",
                api_key="lm-studio" 
            )
        else:
            # Assumes Gemini via OpenAI-compatible endpoint
            self.client = OpenAI(
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                api_key=api_key
            )

    async def get_analysis(self, prompt: str, model_name: str):
        if not self.client:
            return "Client not initialized."
        
        # This is where the magic happens
        response = self.client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content

scout = ScoutAgent()