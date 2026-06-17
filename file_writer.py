#!/usr/bin/env python3
"""
Скрипт для объединения содержимого всех файлов проекта в один текстовый файл.
Запуск: python -m file_writer "путь/к/проекту"
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime

# Расширения файлов, которые стоит игнорировать (бинарные и служебные)
IGNORE_EXTENSIONS = {
    '.pyc', '.pyo', '.pyd', '.so', '.dll', '.dylib',
    '.exe', '.bin', '.obj', '.o', '.a', '.lib',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
    '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv',
    '.zip', '.tar', '.gz', '.rar', '.7z',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.db', '.sqlite', '.sqlite3',
    '.log', '.cache', '.lock',
    '.whl', '.egg', '.egg-info', '.json'
}

# Директории, которые нужно игнорировать
IGNORE_DIRS = {
    '__pycache__', '.git', '.svn', '.hg',
    '.venv', 'env', '.env', 'virtualenv',
    'node_modules',
    '.idea', '.vscode',
    'dist', 'build', '*.egg-info',
    '.mypy_cache', '.pytest_cache', '.hypothesis',
    '.coverage', 'htmlcov', 'logs', 'htmlcov',
}


def should_ignore(path: Path, root_dir: Path) -> bool:
    """
    Проверяет, нужно ли игнорировать файл или директорию.
    """
    # Относительный путь от корневой директории
    try:
        rel_path = path.relative_to(root_dir)
    except ValueError:
        return True

    # Проверяем, находится ли путь в игнорируемой директории
    for part in rel_path.parts:
        if part in IGNORE_DIRS:
            return True
        # Проверяем паттерны с *
        if any(part == ignore_dir.replace('*', '') for ignore_dir in IGNORE_DIRS if '*' in ignore_dir):
            return True

    # Для файлов проверяем расширение
    if path.is_file():
        return path.suffix.lower() in IGNORE_EXTENSIONS

    return False


def read_file_content(file_path: Path) -> str:
    """
    Безопасно читает содержимое файла в разных кодировках.
    """
    encodings = ['utf-8', 'cp1251', 'latin-1', 'koi8-r']

    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return f.read()
        except (UnicodeDecodeError, UnicodeError):
            continue

    # Если ни одна кодировка не подошла, пробуем прочитать как бинарный и декодировать игнорируя ошибки
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
            # Пытаемся декодировать как UTF-8, игнорируя ошибки
            return content.decode('utf-8', errors='ignore')
    except Exception as e:
        return f"[Ошибка чтения файла: {e}]"


def collect_files(root_dir: Path) -> list:
    """
    Собирает все файлы в директории рекурсивно.
    """
    files = []

    for root, dirs, filenames in os.walk(root_dir):
        # Удаляем из обхода игнорируемые директории
        dirs[:] = [d for d in dirs if not should_ignore(Path(root) / d, root_dir)]

        for filename in filenames:
            file_path = Path(root) / filename
            if not should_ignore(file_path, root_dir):
                files.append(file_path)

    return sorted(files)  # Сортируем для консистентности


def write_project_content(root_dir: Path, output_file: Path):
    """
    Основная функция для записи содержимого проекта в файл.
    """
    print(f"Сканирование директории: {root_dir}")

    if not root_dir.exists():
        print(f"Ошибка: Директория {root_dir} не существует!")
        sys.exit(1)

    files = collect_files(root_dir)
    print(f"Найдено файлов для обработки: {len(files)}")

    with open(output_file, 'w', encoding='utf-8') as out_f:
        # Записываем заголовок
        out_f.write(f"Проект: {root_dir}\n")
        out_f.write(f"Дата создания: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        out_f.write(f"Всего файлов: {len(files)}\n")
        out_f.write("=" * 80 + "\n\n")

        # Обрабатываем каждый файл
        for i, file_path in enumerate(files, 1):
            try:
                # Записываем путь к файлу
                out_f.write(f"{file_path}\n")
                out_f.write("-" * 80 + "\n")

                # Читаем и записываем содержимое
                content = read_file_content(file_path)
                out_f.write(content)

                # Добавляем разделитель между файлами (кроме последнего)
                if i < len(files):
                    out_f.write("\n\n" + "=" * 80 + "\n\n")
                else:
                    out_f.write("\n")

                # Прогресс
                if i % 10 == 0 or i == len(files):
                    print(f"Обработано файлов: {i}/{len(files)}")

            except Exception as e:
                error_msg = f"[Ошибка обработки файла {file_path}: {e}]"
                out_f.write(error_msg + "\n")
                print(f"Ошибка: {file_path} - {e}")

    print(f"\nГотово! Результат сохранён в: {output_file}")
    print(f"Размер файла: {output_file.stat().st_size / 1024:.2f} KB")


def main():
    parser = argparse.ArgumentParser(
        description="Объединяет содержимое всех файлов проекта в один текстовый файл"
    )
    parser.add_argument(
        "project_path",
        help="Путь к корневой директории проекта"
    )
    parser.add_argument(
        "-o", "--output",
        help="Имя выходного файла (по умолчанию: project_content.txt в текущей директории)",
        default="project_content.txt"
    )

    args = parser.parse_args()

    # Преобразуем пути
    root_dir = Path(args.project_path).resolve()

    # Если указан относительный путь для выходного файла, сохраняем в текущей директории
    if not os.path.isabs(args.output):
        output_file = Path.cwd() / args.output
    else:
        output_file = Path(args.output)

    write_project_content(root_dir, output_file)


if __name__ == "__main__":
    main()