// ━━━━━━━━ تنظیمات متمرکز API ━━━━━━━━
// برای تغییر آدرس سرور، متغیر VITE_API_BASE_URL را هنگام build تنظیم کنید.
// - اگر فرانت و بک‌اند روی یک دامنه با پروکسی Nginx باشند (روش پیشنهادی Docker):
//     VITE_API_BASE_URL=""  → درخواست‌ها به صورت نسبی به /api ارسال می‌شوند.
// - اگر بک‌اند روی آدرس جدا باشد:
//     VITE_API_BASE_URL="https://api.example.com"
// هیچ آدرسی نباید جای دیگری در کد به‌صورت ثابت نوشته شود.

const _env = (import.meta as any).env?.VITE_API_BASE_URL;

export const API_BASE_URL =
  _env !== undefined && _env !== null
    ? String(_env).replace(/\/$/, "") // مقدار تعیین‌شده (حتی رشتهٔ خالی = same-origin)
    : "http://localhost:8000";        // پیش‌فرض حالت توسعه
