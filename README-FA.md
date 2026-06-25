# سامانهٔ ساماندهی نیروی انسانی آموزش و پرورش

نسخهٔ تحت وب — React + FastAPI — طراح: پایا محمودی

---

## 🚀 روش پیشنهادی استقرار: Docker (یک‌دستوره)

این روش هم فرانت‌اند، هم بک‌اند، هم پایگاه‌داده را با یک دستور بالا می‌آورد و نیازی به تنظیمات پیچیده ندارد.

### پیش‌نیاز
فقط **Docker** و **Docker Compose** روی سرور نصب باشد. (روی اوبونتو: `sudo apt install docker.io docker-compose-plugin`)

### گام‌ها
```bash
# ۱) فایل تنظیمات را بسازید
cp .env.example .env

# ۲) یک کلید امنیتی قوی بسازید و در .env بگذارید (مقابل SECRET_KEY)
python3 -c "import secrets; print(secrets.token_urlsafe(48))"

# ۳) داخل فایل .env این دو مقدار را حتماً پر کنید:
#     SECRET_KEY=<کلیدی که بالا ساختید>
#     ADMIN_PASSWORD=<یک رمز قوی برای مدیر اصلی>

# ۴) اجرا
docker compose up -d --build
```

تمام! سامانه روی `http://آدرس‌سرور` (پورت ۸۰) بالا می‌آید.
برای تغییر پورت، `WEB_PORT` را در `.env` تنظیم کنید.

### ورود اولیه
- نام کاربری: مقدار `ADMIN_USERNAME` (پیش‌فرض `paya`)
- رمز عبور: مقدار `ADMIN_PASSWORD` که در `.env` گذاشتید
- ⚠️ بعد از اولین ورود، حتماً از داخل سامانه رمز را تغییر دهید.

### دستورات مفید
```bash
docker compose logs -f          # مشاهدهٔ لاگ‌ها
docker compose down             # توقف سامانه
docker compose up -d --build    # اجرای مجدد پس از تغییر
```

---

## 🔐 دامنه و HTTPS (اختیاری ولی توصیه‌شده)
برای انتشار روی دامنهٔ واقعی با گواهی SSL، یک Nginx/Caddy جلوی سرویس قرار دهید یا از
[Caddy](https://caddyserver.com/) که خودکار گواهی Let's Encrypt می‌گیرد استفاده کنید.
نمونهٔ ساده با Caddy (فایل `Caddyfile`):
```
saman.example.com {
    reverse_proxy localhost:80
}
```

---

## 🗄️ پشتیبان‌گیری از پایگاه‌داده
کل داده‌ها در volume به نام `backend_data` (فایل SQLite) ذخیره می‌شود.
```bash
# گرفتن نسخهٔ پشتیبان
docker compose cp backend:/app/data/saman_edu.db ./backup-$(date +%F).db

# بازگرداندن
docker compose cp ./backup.db backend:/app/data/saman_edu.db
docker compose restart backend
```

---

## 🧩 جایگذاری دادهٔ هر استان (Excel)
سامانه به‌صورت پیش‌فرض با دادهٔ نمونهٔ شهرستان سامان بارگذاری می‌شود.
هر منطقه/استان می‌تواند دادهٔ خودش را وارد کند:
1. وارد سامانه شوید → بخش **«ورود/خروج»**.
2. فایل اکسل را با همان ساختار قالب (شیت‌های: رشته استخدامی، گروه تدریس، درس، صلاحیت تدریس، مدارس، نیروها، تراز ابلاغ) آپلود کنید.
3. سامانه داده‌ها را با **کد** به هم وصل می‌کند (نه با اسم) و تحلیل نیرو خودکار محاسبه می‌شود.

> قالب خام اکسل را می‌توانید از همان بخش «ورود/خروج» → «دریافت قالب» بگیرید.

---

## 🛠️ اجرای محلی برای توسعه (بدون Docker)

### بک‌اند
```bash
cd server
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export APP_ENV=development          # کلید و رمز موقت ساخته می‌شود
python main.py                      # روی http://localhost:8000
```

### فرانت‌اند
```bash
npm install
npm run dev                         # روی http://localhost:5173
```
در حالت توسعه، فرانت‌اند به‌صورت پیش‌فرض به `http://localhost:8000` وصل می‌شود.

---

## 🔒 خلاصهٔ تدابیر امنیتی این نسخه
- رمزها با **bcrypt** هش می‌شوند (بدون وابستگی منسوخ).
- احراز هویت با **JWT**؛ هیچ رمز محلی/آفلاینی در فرانت‌اند وجود ندارد.
- **محدودیت تلاش ورود** (ضد Brute-force) — پس از چند تلاش ناموفق، موقتاً مسدود.
- **هدرهای امنیتی** روی Nginx و بک‌اند.
- کلید رمزنگاری و رمز مدیر **فقط از متغیرهای محیطی** خوانده می‌شوند؛ در حالت production اگر تنظیم نشوند سرور بالا نمی‌آید.
- هر کاربر فقط به دادهٔ خودش دسترسی دارد (کنترل دسترسی در سمت سرور).
- مستندات Swagger در production غیرفعال است.

---

## 📋 ساختار پروژه
```
.
├── docker-compose.yml      # اجرای کل سامانه
├── Dockerfile              # ساخت فرانت‌اند + Nginx
├── nginx.conf              # سرو SPA و پروکسی /api
├── .env.example            # نمونهٔ تنظیمات (کپی → .env)
├── src/                    # کد فرانت‌اند (React)
│   └── data/sampleData.ts  # دادهٔ پیش‌فرض (از اکسل ساخته شده)
└── server/                 # بک‌اند (FastAPI)
    ├── main.py  auth.py  config.py  database.py
    ├── requirements.txt
    └── Dockerfile
```

طراح: **پایا محمودی**
