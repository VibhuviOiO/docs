# ⚡ vLLM - High-Performance LLM Inference Engine

vLLM is a fast and easy-to-use library for LLM inference and serving. It provides high-throughput serving with various decoding algorithms, continuous batching, and optimized CUDA kernels for maximum performance.

## 📋 Prerequisites

- Python 3.8+ 
- CUDA 11.8+ (for GPU acceleration)
- PyTorch 2.0+
- At least 16GB GPU memory for most models
- Linux or WSL2 (recommended)

## 🛠️ Installation

### Basic Installation
```bash
# Install from PyPI
pip install vllm

# Install with specific CUDA version
pip install vllm --extra-index-url https://download.pytorch.org/whl/cu118

# Install from source (latest features)
git clone https://github.com/vllm-project/vllm.git
cd vllm
pip install -e .
```

### Docker Installation
```bash
# Pull official Docker image
docker pull vllm/vllm-openai:latest

# Run with GPU support
docker run --gpus all \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    -p 8000:8000 \
    --ipc=host \
    vllm/vllm-openai:latest \
    --model microsoft/DialoGPT-medium
```

## 🚀 Quick Start

### Basic Text Generation
```python
from vllm import LLM, SamplingParams

# Initialize the model
llm = LLM(model="microsoft/DialoGPT-medium")

# Define sampling parameters
sampling_params = SamplingParams(
    temperature=0.8,
    top_p=0.95,
    max_tokens=100
)

# Generate text
prompts = [
    "The future of AI is",
    "In a world where technology",
    "The most important skill for developers"
]

outputs = llm.generate(prompts, sampling_params)

for output in outputs:
    prompt = output.prompt
    generated_text = output.outputs[0].text
    print(f"Prompt: {prompt!r}, Generated text: {generated_text!r}")
```

### OpenAI-Compatible API Server
```bash
# Start API server
python -m vllm.entrypoints.openai.api_server \
    --model microsoft/DialoGPT-medium \
    --port 8000 \
    --host 0.0.0.0

# Test with curl
curl http://localhost:8000/v1/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "microsoft/DialoGPT-medium",
        "prompt": "San Francisco is a",
        "max_tokens": 50,
        "temperature": 0.7
    }'
```

## 🏗️ Advanced Configuration

### Model Loading Options
```python
from vllm import LLM, SamplingParams

# Load with specific configurations
llm = LLM(
    model="meta-llama/Llama-2-7b-chat-hf",
    tensor_parallel_size=2,  # Use 2 GPUs
    dtype="float16",         # Use half precision
    max_model_len=4096,      # Maximum sequence length
    gpu_memory_utilization=0.9,  # Use 90% of GPU memory
    trust_remote_code=True,  # Allow custom model code
    download_dir="/path/to/models",  # Custom model cache
)

# Advanced sampling parameters
sampling_params = SamplingParams(
    temperature=0.8,
    top_p=0.95,
    top_k=50,
    repetition_penalty=1.1,
    max_tokens=512,
    stop=["</s>", "\n\n"],
    presence_penalty=0.1,
    frequency_penalty=0.1,
)
```

### Multi-GPU Setup
```python
# Tensor parallelism across multiple GPUs
llm = LLM(
    model="meta-llama/Llama-2-13b-chat-hf",
    tensor_parallel_size=4,  # Use 4 GPUs
    pipeline_parallel_size=1,
    max_model_len=2048,
    dtype="bfloat16",
)

# Pipeline parallelism for very large models
llm = LLM(
    model="meta-llama/Llama-2-70b-chat-hf",
    tensor_parallel_size=4,
    pipeline_parallel_size=2,  # 8 GPUs total (4x2)
    max_model_len=2048,
)
```

## 🔧 Production Deployment

### Docker Compose Setup
```yaml
# docker-compose.yml
version: '3.8'

services:
  vllm-server:
    image: vllm/vllm-openai:latest
    ports:
      - "8000:8000"
    volumes:
      - ~/.cache/huggingface:/root/.cache/huggingface
      - ./models:/models
    environment:
      - CUDA_VISIBLE_DEVICES=0,1
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 2
              capabilities: [gpu]
    command: >
      --model meta-llama/Llama-2-7b-chat-hf
      --host 0.0.0.0
      --port 8000
      --tensor-parallel-size 2
      --max-model-len 4096
      --gpu-memory-utilization 0.9
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - vllm-server
```

### Nginx Load Balancer
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream vllm_backend {
        server vllm-server:8000;
        # Add more servers for load balancing
        # server vllm-server-2:8000;
        # server vllm-server-3:8000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://vllm_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Increase timeouts for long generations
            proxy_connect_timeout 60s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
        }

        location /health {
            proxy_pass http://vllm_backend/health;
            access_log off;
        }
    }
}
```

### Kubernetes Deployment
```yaml
# vllm-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-server
  labels:
    app: vllm-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vllm-server
  template:
    metadata:
      labels:
        app: vllm-server
    spec:
      containers:
      - name: vllm-server
        image: vllm/vllm-openai:latest
        ports:
        - containerPort: 8000
        args:
          - --model
          - meta-llama/Llama-2-7b-chat-hf
          - --host
          - 0.0.0.0
          - --port
          - "8000"
          - --tensor-parallel-size
          - "1"
          - --max-model-len
          - "4096"
        resources:
          requests:
            nvidia.com/gpu: 1
            memory: "16Gi"
            cpu: "4"
          limits:
            nvidia.com/gpu: 1
            memory: "32Gi"
            cpu: "8"
        volumeMounts:
        - name: model-cache
          mountPath: /root/.cache/huggingface
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: model-cache
        persistentVolumeClaim:
          claimName: model-cache-pvc
      nodeSelector:
        accelerator: nvidia-tesla-v100

---
apiVersion: v1
kind: Service
metadata:
  name: vllm-service
spec:
  selector:
    app: vllm-server
  ports:
    - protocol: TCP
      port: 8000
      targetPort: 8000
  type: LoadBalancer
```

## 🔄 Batch Processing

### Offline Batch Inference
```python
from vllm import LLM, SamplingParams
import json

def batch_inference(input_file, output_file, model_name):
    # Load model
    llm = LLM(
        model=model_name,
        tensor_parallel_size=2,
        max_model_len=2048,
    )
    
    # Load prompts
    with open(input_file, 'r') as f:
        prompts = [json.loads(line)['prompt'] for line in f]
    
    # Sampling parameters
    sampling_params = SamplingParams(
        temperature=0.7,
        top_p=0.9,
        max_tokens=256,
        stop=["</s>"]
    )
    
    # Generate in batches
    batch_size = 32
    results = []
    
    for i in range(0, len(prompts), batch_size):
        batch_prompts = prompts[i:i+batch_size]
        outputs = llm.generate(batch_prompts, sampling_params)
        
        for output in outputs:
            results.append({
                'prompt': output.prompt,
                'generated_text': output.outputs[0].text,
                'tokens': len(output.outputs[0].token_ids),
            })
    
    # Save results
    with open(output_file, 'w') as f:
        for result in results:
            f.write(json.dumps(result) + '\n')

# Usage
batch_inference('prompts.jsonl', 'outputs.jsonl', 'meta-llama/Llama-2-7b-chat-hf')
```

### Streaming Responses
```python
from vllm import LLM, SamplingParams

llm = LLM(model="microsoft/DialoGPT-medium")

def stream_generate(prompt):
    sampling_params = SamplingParams(
        temperature=0.8,
        max_tokens=200,
        stream=True
    )
    
    for output in llm.generate([prompt], sampling_params):
        for token_output in output.outputs:
            yield token_output.text

# Usage
for chunk in stream_generate("The future of AI is"):
    print(chunk, end='', flush=True)
```

## 🎯 Model-Specific Configurations

### Llama 2 Setup
```python
from vllm import LLM, SamplingParams

# Llama 2 7B
llm = LLM(
    model="meta-llama/Llama-2-7b-chat-hf",
    tensor_parallel_size=1,
    max_model_len=4096,
    dtype="float16",
)

# Chat template for Llama 2
def format_llama2_prompt(system_message, user_message):
    return f"""<s>[INST] <<SYS>>
{system_message}
<</SYS>>

{user_message} [/INST]"""

system_msg = "You are a helpful assistant."
user_msg = "Explain quantum computing in simple terms."
prompt = format_llama2_prompt(system_msg, user_msg)

sampling_params = SamplingParams(
    temperature=0.7,
    top_p=0.9,
    max_tokens=512,
    stop=["</s>"]
)

outputs = llm.generate([prompt], sampling_params)
print(outputs[0].outputs[0].text)
```

### Code Generation Models
```python
# CodeLlama setup
llm = LLM(
    model="codellama/CodeLlama-7b-Python-hf",
    tensor_parallel_size=1,
    max_model_len=2048,
    trust_remote_code=True,
)

# Code generation prompt
code_prompt = """# Write a Python function to calculate fibonacci numbers
def fibonacci(n):"""

sampling_params = SamplingParams(
    temperature=0.1,  # Lower temperature for code
    top_p=0.95,
    max_tokens=256,
    stop=["\n\n", "def ", "class "]
)

outputs = llm.generate([code_prompt], sampling_params)
print(code_prompt + outputs[0].outputs[0].text)
```

## 📊 Performance Monitoring

### Metrics Collection
```python
import time
import psutil
import GPUtil
from vllm import LLM, SamplingParams

class PerformanceMonitor:
    def __init__(self):
        self.metrics = []
    
    def measure_inference(self, llm, prompts, sampling_params):
        start_time = time.time()
        start_gpu = GPUtil.getGPUs()[0].memoryUsed
        
        outputs = llm.generate(prompts, sampling_params)
        
        end_time = time.time()
        end_gpu = GPUtil.getGPUs()[0].memoryUsed
        
        total_tokens = sum(len(output.outputs[0].token_ids) for output in outputs)
        
        metrics = {
            'duration': end_time - start_time,
            'tokens_per_second': total_tokens / (end_time - start_time),
            'gpu_memory_used': end_gpu - start_gpu,
            'batch_size': len(prompts),
            'total_tokens': total_tokens,
        }
        
        self.metrics.append(metrics)
        return outputs, metrics

# Usage
monitor = PerformanceMonitor()
llm = LLM(model="microsoft/DialoGPT-medium")
sampling_params = SamplingParams(temperature=0.8, max_tokens=100)

prompts = ["Hello world"] * 10
outputs, metrics = monitor.measure_inference(llm, prompts, sampling_params)
print(f"Tokens/sec: {metrics['tokens_per_second']:.2f}")
```

### Health Check Endpoint
```python
from fastapi import FastAPI
from vllm import LLM, SamplingParams
import uvicorn

app = FastAPI()
llm = LLM(model="microsoft/DialoGPT-medium")

@app.get("/health")
async def health_check():
    try:
        # Quick inference test
        test_output = llm.generate(
            ["Test"], 
            SamplingParams(max_tokens=1, temperature=0)
        )
        return {"status": "healthy", "model_loaded": True}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.get("/metrics")
async def get_metrics():
    import GPUtil
    gpu = GPUtil.getGPUs()[0]
    return {
        "gpu_utilization": gpu.load * 100,
        "gpu_memory_used": gpu.memoryUsed,
        "gpu_memory_total": gpu.memoryTotal,
        "gpu_temperature": gpu.temperature,
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

## 🔒 Security & Authentication

### API Key Authentication
```python
from fastapi import FastAPI, HTTPException, Depends, Header
from vllm import LLM, SamplingParams
import os

app = FastAPI()
llm = LLM(model="microsoft/DialoGPT-medium")

API_KEYS = set(os.getenv("API_KEYS", "").split(","))

async def verify_api_key(x_api_key: str = Header()):
    if x_api_key not in API_KEYS:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

@app.post("/generate")
async def generate_text(
    request: dict,
    api_key: str = Depends(verify_api_key)
):
    prompt = request.get("prompt", "")
    max_tokens = min(request.get("max_tokens", 100), 512)  # Limit max tokens
    
    sampling_params = SamplingParams(
        temperature=request.get("temperature", 0.8),
        max_tokens=max_tokens,
    )
    
    outputs = llm.generate([prompt], sampling_params)
    return {"generated_text": outputs[0].outputs[0].text}
```

### Rate Limiting
```python
from fastapi import FastAPI, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/generate")
@limiter.limit("10/minute")  # 10 requests per minute
async def generate_text(request: Request, data: dict):
    # Generation logic here
    pass
```

## 🔍 Troubleshooting

### Common Issues

1. **Out of Memory Errors**
```python
# Reduce GPU memory usage
llm = LLM(
    model="your-model",
    gpu_memory_utilization=0.8,  # Use 80% instead of 90%
    max_model_len=2048,          # Reduce sequence length
    dtype="float16",             # Use half precision
)
```

2. **Slow Inference**
```python
# Optimize for throughput
llm = LLM(
    model="your-model",
    tensor_parallel_size=2,      # Use multiple GPUs
    max_num_batched_tokens=8192, # Increase batch size
    max_num_seqs=256,           # Process more sequences
)
```

3. **Model Loading Issues**
```bash
# Clear cache and reinstall
pip uninstall vllm
rm -rf ~/.cache/huggingface
pip install vllm --no-cache-dir

# Check CUDA compatibility
python -c "import torch; print(torch.cuda.is_available())"
```

### Debug Mode
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable vLLM debug logging
import os
os.environ["VLLM_LOGGING_LEVEL"] = "DEBUG"

from vllm import LLM
llm = LLM(model="your-model")
```

## 📈 Performance Optimization

### Optimal Batch Sizes
```python
import time
from vllm import LLM, SamplingParams

def benchmark_batch_sizes(model_name, batch_sizes=[1, 4, 8, 16, 32]):
    llm = LLM(model=model_name)
    sampling_params = SamplingParams(temperature=0.8, max_tokens=100)
    
    results = {}
    
    for batch_size in batch_sizes:
        prompts = ["Generate a story about"] * batch_size
        
        start_time = time.time()
        outputs = llm.generate(prompts, sampling_params)
        end_time = time.time()
        
        total_tokens = sum(len(output.outputs[0].token_ids) for output in outputs)
        tokens_per_second = total_tokens / (end_time - start_time)
        
        results[batch_size] = tokens_per_second
        print(f"Batch size {batch_size}: {tokens_per_second:.2f} tokens/sec")
    
    return results

# Find optimal batch size
results = benchmark_batch_sizes("microsoft/DialoGPT-medium")
optimal_batch = max(results, key=results.get)
print(f"Optimal batch size: {optimal_batch}")
```

## 📚 Additional Resources

- [vLLM Documentation](https://vllm.readthedocs.io/)
- [vLLM GitHub Repository](https://github.com/vllm-project/vllm)
- [Performance Benchmarks](https://blog.vllm.ai/2023/06/20/vllm.html)
- [Model Compatibility](https://vllm.readthedocs.io/en/latest/models/supported_models.html)

vLLM provides exceptional performance for LLM inference with minimal setup, making it ideal for production deployments requiring high throughput and low latency.