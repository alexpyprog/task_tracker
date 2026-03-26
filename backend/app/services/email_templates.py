from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.settings import settings

# Путь к папке с шаблонами
TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "email"

# Настройка Jinja2
jinja_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(['html', 'xml']),
    trim_blocks=True,
    lstrip_blocks=True,
)


def render_verification_email(
    username: str,
    verification_url: str,
) -> tuple[str, str]:
    """
    Рендерит письмо для подтверждения email.
    Возвращает (html_content, text_content)
    """
    context = {
        "username": username,
        "verification_url": verification_url,
        "frontend_url": settings.frontend_url,
    }

    html_template = jinja_env.get_template("verification.html")
    text_template = jinja_env.get_template("verification.txt")

    html_content = html_template.render(**context)
    text_content = text_template.render(**context)

    return html_content, text_content