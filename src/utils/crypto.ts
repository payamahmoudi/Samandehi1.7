// ━━━━━━━━ رمزنگاری پشتیبان (AES-256-GCM + PBKDF2) ━━━━━━━━
// نسخهٔ V4: رمزنگاری واقعی و احرازشده با Web Crypto API.
// - هر فایل با salt و IV تصادفی رمز می‌شود (PBKDF2 با ۱۵۰٬۰۰۰ تکرار، SHA-256).
// - هر پشتیبان با «کلید کاربر» و «کلید مدیر اصلی» رمز می‌شود تا هم خودِ کاربر و
//   هم مدیر اصلی بتوانند آن را بازیابی کنند.
// - نسخه‌های قدیمی (V1/V2/V3 مبتنی بر XOR) همچنان قابل بازگشایی‌اند (سازگاری به عقب).
//
// 🔐 مهم: مقدار VITE_BACKUP_SECRET را هنگام build برای هر استقرار تغییر دهید تا
//    کلید رمزنگاری مختص سامانهٔ شما باشد.

const MASTER_SALT = 'SamanEdu#1406!PayaMahmoudi@Secure';
const MASTER_ADMIN_ID = 'admin-master-paya';

// راز سطح استقرار (در صورت تنظیم نشدن، مقدار پیش‌فرض استفاده می‌شود).
const BACKUP_SECRET: string =
  (import.meta as any).env?.VITE_BACKUP_SECRET || 'SamanEdu-Backup-Secret-CHANGE-ME';

const PBKDF2_ITERATIONS = 150_000;
const enc = new TextEncoder();
const dec = new TextDecoder();

// ━━━ کمکی: تبدیل base64 امن برای داده‌های بزرگ ━━━
function bytesToB64(bytes: Uint8Array): string {
  const chunk = 8192;
  let s = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ━━━ مشتق‌سازی کلید AES از راز + شناسهٔ کاربر ━━━
async function deriveAesKey(userId: string, salt: Uint8Array): Promise<CryptoKey> {
  const passphrase = `${BACKUP_SECRET}|${MASTER_SALT}|${userId}`;
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase) as BufferSource, 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ━━━ رمزنگاری یک رشته (خروجی: base64 از salt|iv|ciphertext) ━━━
async function aesEncrypt(plaintext: string, userId: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(userId, salt);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, enc.encode(plaintext) as BufferSource)
  );
  const packed = new Uint8Array(salt.length + iv.length + ct.length);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(ct, salt.length + iv.length);
  return bytesToB64(packed);
}

async function aesDecrypt(b64: string, userId: string): Promise<string | null> {
  try {
    const packed = b64ToBytes(b64);
    const salt = packed.subarray(0, 16);
    const iv = packed.subarray(16, 28);
    const ct = packed.subarray(28);
    const key = await deriveAesKey(userId, salt);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, ct as BufferSource);
    return dec.decode(pt);
  } catch {
    return null;
  }
}

// ━━━━━━━━ سازگاری به عقب: رمزگشایی نسخه‌های قدیمی XOR (V1/V2/V3) ━━━━━━━━
function legacyDeriveKey(userId: string): number[] {
  const raw = MASTER_SALT + userId + MASTER_SALT;
  const key: number[] = [];
  for (let i = 0; i < 32; i++) {
    let h = 0;
    for (let j = i; j < raw.length; j += 32) {
      h = ((h << 5) - h + raw.charCodeAt(j)) & 0xffffffff;
    }
    key.push(Math.abs(h) % 256);
  }
  return key;
}
function legacyDecrypt(b64: string, key: number[]): string | null {
  try {
    const bytes = Array.from(b64ToBytes(b64));
    const decrypted: number[] = [];
    for (let i = 16; i < bytes.length; i++) {
      decrypted.push(bytes[i] ^ key[(i - 16) % key.length] ^ bytes[(i - 1) % bytes.length]);
    }
    return dec.decode(new Uint8Array(decrypted));
  } catch {
    return null;
  }
}

// ━━━━━━━━ رابط عمومی ━━━━━━━━

// رمزنگاری: هم نسخهٔ کلید کاربر، هم نسخهٔ کلید مدیر اصلی ذخیره می‌شود.
export async function encryptData(data: string, userId: string): Promise<string> {
  const userEnc = await aesEncrypt(data, userId);
  const masterEnc = await aesEncrypt(data, MASTER_ADMIN_ID);
  return `SAMAN_ENC_V4:${userId}:${userEnc}:${masterEnc}`;
}

// رمزگشایی: با کلید خود کاربر یا کلید مدیر اصلی کار می‌کند (V4 و نسخه‌های قدیمی).
export async function decryptData(encrypted: string, userId: string): Promise<string | null> {
  try {
    if (encrypted.startsWith('SAMAN_ENC_V4:')) {
      const rest = encrypted.substring('SAMAN_ENC_V4:'.length);
      const firstColon = rest.indexOf(':');
      const secondColon = rest.indexOf(':', firstColon + 1);
      if (firstColon < 0 || secondColon < 0) return null;
      const ownerUserId = rest.substring(0, firstColon);
      const userEnc = rest.substring(firstColon + 1, secondColon);
      const masterEnc = rest.substring(secondColon + 1);
      if (userId === ownerUserId) return aesDecrypt(userEnc, userId);
      if (userId === MASTER_ADMIN_ID) return aesDecrypt(masterEnc, MASTER_ADMIN_ID);
      return null;
    }
    // نسخه‌های قدیمی XOR (V2/V3)
    if (encrypted.startsWith('SAMAN_ENC_V3:') || encrypted.startsWith('SAMAN_ENC_V2:')) {
      const prefix = encrypted.startsWith('SAMAN_ENC_V3:') ? 'SAMAN_ENC_V3:' : 'SAMAN_ENC_V2:';
      const rest = encrypted.substring(prefix.length);
      const firstColon = rest.indexOf(':');
      const secondColon = rest.indexOf(':', firstColon + 1);
      if (firstColon < 0 || secondColon < 0) return null;
      const ownerUserId = rest.substring(0, firstColon);
      const userEnc = rest.substring(firstColon + 1, secondColon);
      const masterEnc = rest.substring(secondColon + 1);
      if (userId === ownerUserId) return legacyDecrypt(userEnc, legacyDeriveKey(userId));
      if (userId === MASTER_ADMIN_ID) return legacyDecrypt(masterEnc, legacyDeriveKey(MASTER_ADMIN_ID));
      return null;
    }
    if (encrypted.startsWith('SAMAN_ENC_V1:')) {
      const b64 = encrypted.substring('SAMAN_ENC_V1:'.length);
      return legacyDecrypt(b64, legacyDeriveKey(userId));
    }
    return null;
  } catch {
    return null;
  }
}

export async function exportEncryptedBackup(userId: string, userName?: string, userLogin?: string): Promise<void> {
  try {
    const allData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes(userId) || key.includes('saman-edu-data') || key.includes('saman-edu-history'))) {
        allData[key] = localStorage.getItem(key) || '';
      }
    }
    if (Object.keys(allData).length === 0) {
      alert('داده‌ای برای پشتیبان‌گیری یافت نشد.');
      return;
    }
    const json = JSON.stringify(allData);
    const encrypted = await encryptData(json, userId);

    const dateStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
    const ownerName = userName || userId;
    const ext = userLogin ? `.${userLogin}` : '.saman';
    const fileName = `پشتیبان_${ownerName}_${dateStr}${ext}`;

    const blob = new Blob([encrypted], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('خطا در پشتیبان‌گیری: ' + (err as Error).message);
  }
}

export function importEncryptedBackup(file: File, userId: string, _userLogin?: string): Promise<{ ok: boolean; message: string }> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const encrypted = reader.result as string;
        if (!encrypted || encrypted.length < 20) {
          resolve({ ok: false, message: 'فایل خالی یا خراب است.' });
          return;
        }
        const decrypted = await decryptData(encrypted, userId);
        if (!decrypted) {
          if (userId === MASTER_ADMIN_ID) {
            resolve({ ok: false, message: 'فایل خراب شده یا معتبر نیست.' });
          } else {
            resolve({ ok: false, message: 'رمزگشایی ناموفق. این فایل متعلق به شما نیست.' });
          }
          return;
        }
        const allData = JSON.parse(decrypted);
        for (const [key, value] of Object.entries(allData)) {
          localStorage.setItem(key, value as string);
        }
        resolve({ ok: true, message: 'بازیابی با موفقیت انجام شد. صفحه بارگذاری مجدد می‌شود...' });
      } catch {
        resolve({ ok: false, message: 'فایل معتبر نیست.' });
      }
    };
    reader.onerror = () => resolve({ ok: false, message: 'خطا در خواندن فایل.' });
    reader.readAsText(file);
  });
}
