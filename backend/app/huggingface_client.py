# backend/app/huggingface_client.py
import os
import requests
from typing import List, Dict, Any

def get_huggingface_client(**maybe_config):
    """Get Hugging Face client for text generation using Inference API"""
    api_key = os.getenv("HUGGINGFACE_API_KEY")
    model_name = os.getenv("CHAT_MODEL", "microsoft/Phi-3.5-mini-instruct")
    base_url = os.getenv("HUGGINGFACE_BASE_URL", "https://api-inference.huggingface.co")
    
    if not api_key:
        raise RuntimeError("HUGGINGFACE_API_KEY not set")
    
    print(f"🔄 Using Hugging Face Inference API for model: {model_name}")
    return HuggingFaceInferenceClient(api_key, base_url, model_name)

class HuggingFaceInferenceClient:
    """Client for Hugging Face Inference Endpoints"""
    def __init__(self, api_key, base_url, model_name):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.model_name = model_name
        self.headers = {"Authorization": f"Bearer {api_key}"}
        self.api_working = None  # Will be set on first call
    
    def __call__(self, prompt, max_new_tokens=150, temperature=0.7, **kwargs):
        """Call the Hugging Face Inference API with fallback"""
        url = f"{self.base_url}/models/{self.model_name}"
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": max_new_tokens,
                "temperature": temperature,
                "do_sample": True,
                "return_full_text": False
            },
            "options": {
                "wait_for_model": True
            }
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            
            if response.status_code == 200:
                self.api_working = True
                result = response.json()
                
                # Handle the response format from Hugging Face Inference API
                if isinstance(result, list) and len(result) > 0:
                    generated_text = result[0].get("generated_text", "")
                else:
                    generated_text = str(result)
                
                return [{"generated_text": prompt + generated_text}]
            else:
                print(f"⚠️ Hugging Face API error: {response.status_code} - {response.text}")
                self.api_working = False
                return self._fallback_response(prompt)
                
        except Exception as e:
            print(f"⚠️ Hugging Face API exception: {e}")
            self.api_working = False
            return self._fallback_response(prompt)
    
    def _fallback_response(self, prompt):
        """Fallback response when API is not available"""
        return [{"generated_text": prompt + " I understand your question, but I'm currently unable to access the AI model. Please check your Hugging Face API configuration."}]

class SimpleTextGenerator:
    """Simple fallback text generator"""
    def __call__(self, prompt, **kwargs):
        # Extract the question from the prompt
        if "Question:" in prompt:
            question = prompt.split("Question:")[-1].split("Answer:")[0].strip()
        else:
            question = "your question"
        
        # Generate a more helpful response based on the context
        if "Excerpts:" in prompt:
            excerpts = prompt.split("Excerpts:")[1].split("Question:")[0].strip()
            if len(excerpts) > 100:
                response = f"Based on the provided excerpts, I can see relevant information about '{question}'. The context contains detailed information that should help answer your question. Let me know if you need me to elaborate on any specific aspect."
            else:
                response = f"I can see some context about '{question}', but it may be limited. Could you provide more specific details about what you'd like to know?"
        else:
            response = f"I understand you're asking about '{question}'. However, I don't see any specific context or excerpts to reference. Could you provide more details or upload a document to get a more specific answer?"
        
        return [{"generated_text": prompt + response}]

# Embedding functionality removed - using simple text search instead
