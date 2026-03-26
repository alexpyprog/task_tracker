# test_email.py
import asyncio
from app.services.email_service import email_service

async def test():
    result = await email_service.send_email(
        to_email="s.avakov@icloud.com",  # сюда любой email
        subject="Test from TaskTracker",
        html_content="<h1>Test</h1><p>SMTP works!</p>",
        text_content="Test - SMTP works!"
    )
    print("Sent:", result)

asyncio.run(test())