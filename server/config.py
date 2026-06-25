import os
import secrets
import sys

# ━━━━━━━━ محیط اجرا ━━━━━━━━
# APP_ENV = "production" یا "development"
APP_ENV = os.getenv("APP_ENV", "development").lower().strip()
IS_PRODUCTION = APP_ENV == "production"

# ━━━━━━━━ کلید رمزنگاری JWT ━━━━━━━━
# در حالت production حتماً باید SECRET_KEY در محیط تنظیم شود، وگرنه سرور بالا نمی‌آید.
SECRET_KEY = os.getenv("SECRET_KEY", "").strip()
if not SECRET_KEY:
    if IS_PRODUCTION:
        sys.exit(
            "❌ خطای امنیتی: متغیر محیطی SECRET_KEY تنظیم نشده است.\n"
            "   یک کلید قوی بسازید و در فایل .env قرار دهید:\n"
            "   python3 -c \"import secrets; print(secrets.token_urlsafe(48))\""
        )
    # فقط در حالت توسعه: کلید موقت (با هر ری‌استارت توکن‌ها باطل می‌شوند)
    SECRET_KEY = secrets.token_urlsafe(48)
    print("⚠️  SECRET_KEY تنظیم نشده؛ یک کلید موقت برای حالت توسعه ساخته شد.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))  # ۸ ساعت

# ━━━━━━━━ پایگاه داده ━━━━━━━━
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./saman_edu.db")

# ━━━━━━━━ مدیر اصلی (رمز اولیه؛ بعد از اولین ورود حتماً تغییر دهید) ━━━━━━━━
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "paya").strip().lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "").strip()
if not ADMIN_PASSWORD:
    if IS_PRODUCTION:
        sys.exit(
            "❌ خطای امنیتی: متغیر محیطی ADMIN_PASSWORD تنظیم نشده است.\n"
            "   یک رمز قوی برای مدیر اصلی در فایل .env قرار دهید (ADMIN_PASSWORD=...)."
        )
    ADMIN_PASSWORD = "ChangeMe-Admin-1406!"  # فقط حالت توسعه
    print("⚠️  ADMIN_PASSWORD تنظیم نشده؛ رمز پیش‌فرض توسعه استفاده شد. حتماً تغییر دهید.")
ADMIN_FULLNAME = os.getenv("ADMIN_FULLNAME", "پایا محمودی")

# ━━━━━━━━ CORS - آدرس فرانت‌اند ━━━━━━━━
# مقادیر را با کاما جدا کنید. در production آدرس واقعی دامنه را بگذارید.
_default_origins = "http://localhost:5173,http://localhost:3000"
FRONTEND_ORIGINS = [
    o.strip() for o in os.getenv("FRONTEND_ORIGINS", _default_origins).split(",") if o.strip()
]

# ━━━━━━━━ محدودیت تلاش ورود (ضد Brute-force) ━━━━━━━━
LOGIN_MAX_ATTEMPTS = int(os.getenv("LOGIN_MAX_ATTEMPTS", "8"))
LOGIN_WINDOW_SECONDS = int(os.getenv("LOGIN_WINDOW_SECONDS", "300"))  # ۵ دقیقه

# ━━━━━━━━ سیاست رمز عبور ━━━━━━━━
PASSWORD_MIN_LENGTH = int(os.getenv("PASSWORD_MIN_LENGTH", "8"))

# ━━━━━━━━ حداکثر حجم آپلود (MB) ━━━━━━━━
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", "10"))
