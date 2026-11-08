FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libsndfile1 espeak-ng fonts-dejavu-core ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY workers/video/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY workers/video/download_models.py /app/download_models.py
RUN python download_models.py
COPY workers/video /app/workers/video
RUN useradd --create-home --uid 10001 worker
USER worker
ENV PYTHONUNBUFFERED=1 VIDEO_ROOT=/tmp/brandcommand-video-test
ENV VIDEO_FONT_REGULAR=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
ENV VIDEO_FONT_BOLD=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
ENV OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2
# One bounded daily execution; disabled unless both owner opt-in and cloud key exist.
# YouTube credentials remain on Evidraw. No local scheduler is started here.
CMD ["timeout","900s","python","workers/video/cloud_daily.py"]
