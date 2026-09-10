# TAMUR Weather Bot — PRODUCTION LOCK

Status: **LOCKED / FINAL**

Bu fayl production contractni belgilaydi. Foydalanuvchining aniq yangi talabisiz quyidagi contract o'zgartirilmasin.

## O'zgarmas production contract

- Shahar: **Buxoro**
- Timezone: **Asia/Tashkent**
- Cron: **0 4 * * *** = har kuni **09:00 Uzbekistan vaqti**
- Har run: Telegramga **2 ta rasm**
  1. `daily-summary.png` — bugungi ob-havo
  2. `weekly-forecast.png` — to'liq 10 kun + menejer tavsiyasi
- Daily primary: WeatherAPI, fallback: Open-Meteo
- 10-day primary: Open-Meteo; fallback faqat to'liq 10 kun bera olsa qabul qilinadi
- Manager tavsiyasi deterministic scoring; LLM ishlatilmaydi
- Production Telegram target `PRODUCTION_LOCK_CHAT_IDS` orqali lock qilinadi
- Token/key hech qachon source yoki logga yozilmaydi

## Himoya qatlamlari

1. `assertProductionLock()` noto'g'ri city/timezone/coordinate/chat targetni fail-fast bloklaydi.
2. Render build `npm run build` orqali typecheck + test + compile o'tkazadi; test yiqilsa yangi deploy live bo'lmaydi.
3. GitHub CI har weather-bot o'zgarishida xuddi shu buildni qayta tekshiradi.
4. 10-kunlik output contract 10 kundan kam forecastni "10 kunlik" deb yuborishni bloklaydi.
5. Telegram yuborishda retry va mustaqil rasm error-handling saqlanadi.

## O'zgartirish tartibi

Production kodni faqat foydalanuvchi aniq o'zgartirish so'raganda oching. Har o'zgarishdan keyin:

1. `npm ci`
2. `npm run build`
3. previewlarni ko'rish
4. GitHub push
5. Render deploy PASS
6. Trigger Run
7. ikkala rasm kerakli guruhga tushganini tekshirish

Shularning biri PASS bo'lmasa production final deb hisoblanmaydi.
