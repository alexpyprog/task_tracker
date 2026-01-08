FROM python:3.12-slim

WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY requirements.txt .

# Устанавливаем зависимости напрямую (без --user)
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходный код
COPY . .

# Копируем entrypoint (если он нужен)
COPY entrypoint.sh .

# Делаем entrypoint исполняемым
RUN chmod +x entrypoint.sh

# Указываем entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]