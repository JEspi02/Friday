import httpx
import logging
import json
import os
from dotenv import load_dotenv

# Ensure .env is loaded so we can grab the LM Studio Key
load_dotenv()

logger = logging.getLogger(__name__)

class ScoutAgent:
    def __init__(self):
        self.provider = "lm-studio"
        self.base_url = "http://127.0.0.1:1234/api/v1"
        self.mcp_integration_id = "mcp/massive-tools" 
        # Pull from .env
        self.lm_studio_token = os.getenv("LM_STUDIO_API_KEY", "")

    def initialize_client(self, provider: str, api_key: str = None, base_url: str = None):
        """
        This method is called by main.py to set up the provider settings.
        """
        self.provider = provider
        if api_key:
            # If it's Gemini, main.py passes the key here. 
            # If it's LM Studio, we can override the .env key if passed.
            self.lm_studio_token = api_key
        if base_url:
            self.base_url = base_url
        
        logger.info(f"Scout initialized with provider: {provider} at {self.base_url}")

    @property
    def auth_headers(self):
        return {
            "Authorization": f"Bearer {self.lm_studio_token}",
            "Content-Type": "application/json"
        }

    async def get_active_model(self) -> str:
        try:
            async with httpx.AsyncClient() as client:
                # Force the standard OpenAI models endpoint
                url = "http://127.0.0.1:1234/v1/models"
                response = await client.get(url, headers=self.auth_headers)
                response.raise_for_status()
                data = response.json()
                if "data" in data and len(data["data"]) > 0:
                    return data["data"][0]["id"]
                return "local-model"
        except Exception as e:
            logger.error(f"Failed to fetch models from LM Studio: {e}")
            return "local-model"

    async def get_analysis(self, prompt: str, model_name: str) -> str:
        active_model = await self.get_active_model()
        
        # Standard OpenAI Payload Format
        payload = {
            "model": active_model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            # This is how LM Studio knows to use your MCP tools
            "integrations": [self.mcp_integration_id] 
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                # Force the standard OpenAI Chat endpoint
                url = "http://127.0.0.1:1234/v1/chat/completions"
                response = await client.post(url, json=payload, headers=self.auth_headers)
                
                if response.status_code == 401:
                    return "Analysis failed: LM Studio rejected the API Key. Check your .env file."
                
                response.raise_for_status()
                result = response.json()
                
                # Parse Standard OpenAI Response
                if "choices" in result and len(result["choices"]) > 0:
                    message_data = result["choices"][0].get("message", {})
                    content = message_data.get("content", "")
                    
                    # Some reasoning models return their thoughts in a separate field
                    reasoning = message_data.get("reasoning_content", "")
                    
                    final_output = ""
                    if reasoning:
                        final_output += f"[Thinking]:\n{reasoning}\n\n"
                    if content:
                        final_output += f"[Analysis]:\n{content}"
                        
                    return final_output.strip() or "AI returned an empty response."

                return "AI returned an unexpected format."

        except Exception as e:
            logger.error(f"Error communicating with LM Studio: {e}")
            return f"Analysis failed: {str(e)}"
        
scout = ScoutAgent()