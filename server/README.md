# بک‌اند سامانه (FastAPI)

راه‌اندازی کامل و استقرار در فایل `../README-FA.md` توضیح داده شده است (روش پیشنهادی: Docker از ریشهٔ پروژه).

## اجرای مستقل (توسعه)
```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export APP_ENV=development
python main.py        # http://localhost:8000
```

## متغیرهای محیطی مهم
| متغیر | توضیح |
|---|---|
| `APP_ENV` | `production` یا `development` |
| `SECRET_KEY` | کلید JWT (در production الزامی) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | مدیر اصلی (در production رمز الزامی) |
| `DATABASE_URL` | پیش‌فرض SQLite در `./data/` |
| `FRONTEND_ORIGINS` | آدرس‌های مجاز CORS (با کاما) |
| `LOGIN_MAX_ATTEMPTS` / `LOGIN_WINDOW_SECONDS` | محدودیت ضد Brute-force |
| `PASSWORD_MIN_LENGTH` | حداقل طول رمز کاربران |

## نکات امنیتی
- در `APP_ENV=production` اگر `SECRET_KEY` یا `ADMIN_PASSWORD` تنظیم نشده باشد، سرور عمداً بالا نمی‌آید.
- رمزها با bcrypt هش می‌شوند؛ توکن‌ها JWT با انقضا.
- مستندات Swagger/OpenAPI در این نسخه غیرفعال است.

طراح: پایا محمودی
