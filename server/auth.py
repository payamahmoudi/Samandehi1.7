from datetime import datetime, timedelta, timezone
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, PASSWORD_MIN_LENGTH

# ━━━━━━━━ رمزنگاری رمز عبور (bcrypt مستقیم؛ پایدار و بدون وابستگی منسوخ) ━━━━━━━━

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# bcrypt حداکثر ۷۲ بایت را پردازش می‌کند؛ برای ایمنی بایت‌ها را کوتاه می‌کنیم.
def _pw_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_pw_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(_pw_bytes(plain_password), hashed_password.encode("utf-8"))
    except Exception:
        return False


def validate_password_strength(password: str) -> None:
    """در صورت ضعیف بودن رمز، خطای ۴۰۰ برمی‌گرداند."""
    if not password or len(password) < PASSWORD_MIN_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"رمز عبور باید حداقل {PASSWORD_MIN_LENGTH} کاراکتر باشد.",
        )
    has_letter = any(c.isalpha() for c in password)
    has_digit = any(c.isdigit() for c in password)
    if not (has_letter and has_digit):
        raise HTTPException(
            status_code=400,
            detail="رمز عبور باید شامل حداقل یک حرف و یک عدد باشد.",
        )


# ━━━━━━━━ توکن JWT ━━━━━━━━

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="توکن نامعتبر است. لطفاً دوباره وارد شوید.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return {"user_id": user_id, "role": payload.get("role", "user")}
    except JWTError:
        raise credentials_exception
