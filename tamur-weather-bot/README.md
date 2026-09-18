# TAMUR Weather Bot — Buxoro ob-havo

Har kuni soat **09:00 (Asia/Tashkent)** da Buxoro shahri uchun TAMUR Telegram
guruhiga **2 ta premium rasm** yuboradi:

1. **Kunlik ob-havo kartasi** (`daily-summary.png`) — bugungi kun to‘liq xulosasi.
2. **10 kunlik kutilayotgan ob-havo** (`weekly-forecast.png`) — bugun + 9 kun, harorat grafigi
   va **menejer tavsiyasi**.

## Asosiy biznes qoidalari

- Kunlik kartada **Hafta oxiri savdo indeksi**:
  - Juma **+30%**
  - Shanba **+50%**
  - Yakshanba **+80%**
  - izoh: **Past savdo kunlariga nisbatan**
- **Qat'iy xodim qoidasi:** Shanba va Yakshanba kuni **ob-havodan qat'i nazar**
  xodimlarga javob berilmaydi.
- Ob-havo bo'yicha sust kun uchun **"1 xodimga javob berish mumkin"** tavsiyasi
  faqat **Dushanba–Juma** kunlaridan biriga chiqishi mumkin.
- Menejer tavsiyasi deterministic; LLM ishlatilmaydi.
- Namlik, oy fazasi, quyosh chiqishi/botishi kunlik kartada ko'rsatilmaydi.

## Production

- Shahar: **Buxoro**
- Timezone: **Asia/Tashkent**
- Cron: **0 4 * * *** = 09:00 Uzbekistan vaqti
- Telegram: **bitta production guruh**
- Daily primary: WeatherAPI, fallback: Open-Meteo
- 10-day primary: Open-Meteo
- Har run: 2 ta rasm

## Test / build

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

`npm run build` typecheck + test + compile orqali production regressiyalarini bloklaydi.

Batafsil o'zgarmas contract: `PRODUCTION_LOCK.md`.
