FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "from transformers import pipeline; pipeline('sentiment-analysis', model='lxyuan/distilbert-base-multilingual-cased-sentiments-student', top_k=None)"

# Copy application code
COPY . .

ENV TRANSFORMERS_OFFLINE=1
ENV HF_HUB_OFFLINE=1
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8085

# Run the application
CMD ["python", "main.py"]
