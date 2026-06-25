# ━━━━━━━━ مرحله ۱: ساخت فرانت‌اند ━━━━━━━━
FROM node:20-alpine AS build
WORKDIR /app

# نصب وابستگی‌ها (با کش بهتر)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# کپی کد و ساخت
COPY . .
# آدرس API به صورت نسبی (same-origin) تا پروکسی Nginx آن را به بک‌اند برساند
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_BACKUP_SECRET=""
ENV VITE_BACKUP_SECRET=$VITE_BACKUP_SECRET
RUN npm run build

# ━━━━━━━━ مرحله ۲: سرو با Nginx ━━━━━━━━
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
