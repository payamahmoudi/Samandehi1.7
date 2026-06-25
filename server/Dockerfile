FROM python:3.11-slim

# تنظیمات پایتون
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# نصب وابستگی‌ها
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# کپی کد سرور
COPY . .

# اجرای غیر-root برای امنیت بیشتر
RUN useradd -m appuser && mkdir -p /app/data && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# پایگاه‌داده در پوشهٔ data (volume) ذخیره می‌شود
ENV DATABASE_URL="sqlite:///./data/saman_edu.db"

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request,sys; urllib.request.urlopen('http://127.0.0.1:8000/api/health'); " || exit 1

# Gunicorn با ورکرهای Uvicorn (مناسب production)
CMD ["gunicorn", "main:app", "-k", "uvicorn.workers.UvicornWorker", \
     "-w", "2", "-b", "0.0.0.0:8000", "--timeout", "120"]
