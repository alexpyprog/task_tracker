FROM python:3.12-slim

WORKDIR /app

# Копируем и устанавливаем зависимости
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь бекенд
COPY backend/ .
COPY backend/entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]