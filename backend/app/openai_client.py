# backend/app/openai_client.py
import os
from openai import OpenAI
from typing import List, Dict, Any

def get_openai_client(**maybe_config):
    """Get OpenAI client for text generation"""
    api_key = os.getenv("OPENAI_API_KEY")
    model_name = os.getenv("CHAT_MODEL", "gpt-3.5-turbo")
    
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    
    print(f"🔄 Using OpenAI API for model: {model_name}")
    return OpenAIClient(api_key, model_name)

class OpenAIClient:
    """Client for OpenAI API"""
    def __init__(self, api_key, model_name):
        self.api_key = api_key
        self.model_name = model_name
        self.client = OpenAI(api_key=api_key)
        self.api_working = None  # Will be set on first call
    
    def __call__(self, prompt, max_tokens=300, temperature=0.7, **kwargs):
        """Call the OpenAI API with fallback"""
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )
            
            self.api_working = True
            generated_text = response.choices[0].message.content.strip()
            
            return [{"generated_text": generated_text}]
            
        except Exception as e:
            print(f"⚠️ OpenAI API exception: {e}")
            self.api_working = False
            return self._fallback_response(prompt)
    
    def _fallback_response(self, prompt):
        """Fallback response when API is not available"""
        return [{"generated_text": "I understand your question, but I'm currently unable to access the AI model. Please check your OpenAI API configuration."}]

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
        
        return [{"generated_text": response}]
