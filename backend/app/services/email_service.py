import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.settings import settings
from app.logger.file_logger import CustomLogger

logger = CustomLogger("email_service")


class EmailService:
    """Сервис для отправки писем через SMTP (синхронный smtplib в отдельном потоке)"""

    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.user = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.use_tls = settings.SMTP_USE_TLS
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        """
        Отправить письмо через SMTP (асинхронно в отдельном потоке)
        """
        try:
            # Запускаем синхронную отправку в отдельном потоке, чтобы не блокировать event loop
            return await asyncio.to_thread(
                self._send_email_sync,
                to_email,
                subject,
                html_content,
                text_content,
            )
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    def _send_email_sync(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        """Синхронная отправка письма (вызывается в отдельном потоке)"""
        try:
            # Создаем сообщение
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email

            # Добавляем текстовую версию (если есть)
            if text_content:
                msg.attach(MIMEText(text_content, "plain", "utf-8"))

            # Добавляем HTML версию
            msg.attach(MIMEText(html_content, "html", "utf-8"))

            # Подключаемся к SMTP серверу
            if self.use_tls:
                # Для TLS (порт 587)
                with smtplib.SMTP(self.host, self.port) as server:
                    server.starttls()
                    if self.user and self.password:
                        server.login(self.user, self.password)
                    server.send_message(msg)
            else:
                # Для SSL (порт 465) или без шифрования
                if self.port == 465:
                    with smtplib.SMTP_SSL(self.host, self.port) as server:
                        if self.user and self.password:
                            server.login(self.user, self.password)
                        server.send_message(msg)
                else:
                    with smtplib.SMTP(self.host, self.port) as server:
                        if self.user and self.password:
                            server.login(self.user, self.password)
                        server.send_message(msg)

            logger.info(f"Email sent to {to_email}: {subject}")
            return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {e}")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending email: {e}")
            return False


# Создаем экземпляр сервиса
email_service = EmailService()