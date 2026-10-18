# TAMUR Weather Bot — Buxoro ob-havo

Har kuni soat **09:00 (Asia/Tashkent)** da Buxoro shahri uchun TAMUR Telegram
guruhiga **1 ta premium rasm** yuboradi:

**10 kunlik kutilayotgan ob-havo** (`weekly-forecast.png`) — bugun + 9 kun (har
kun uchun hafta kuni + **sana**, ikon, kunduzgi/tungi harorat), harorat grafigi,
**Hafta oxiri savdo indeksi** (Juma +30%, Shanba +50%, Yakshanba +80%) va
**menejer tavsiyasi**. Bugungi kunlik karta endi yuborilmaydi (bitta rasm yetarli).

## Asosiy biznes qoidalari

- Rasmda **Hafta oxiri savdo indeksi**:
  - Juma **+30%**
  - Shanba **+50%**
  - Yakshanba **+80%**
  - izoh: **Past savdo kunlariga nisbatan**
- **Qat'iy xodim qoidasi:** Shanba va Yakshanba kuni **ob-havodan qat'i nazar**
  xodimlarga javob berilmaydi.
- Ob-havo bo'yicha sust kun uchun **"1 xodimga javob berish mumkin"** tavsiyasi
  faqat **Dushanba–Juma** kunlaridan biriga chiqishi mumkin.
- Menejer tavsiyasi deterministic; LLM ishlatilmaydi.

## Production

- Shahar: **Buxoro**
- Timezone: **Asia/Tashkent**
- Cron: **0 4 * * *** = 09:00 Uzbekistan vaqti
- Telegram: **bitta production guruh**
- Daily primary: WeatherAPI, fallback: Open-Meteo
- 10-day primary: Open-Meteo
- Har run: 1 ta rasm (`weekly-forecast.png`)

## Test / build

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

`npm run build` typecheck + test + compile orqali production regressiyalarini bloklaydi.

Batafsil o'zgarmas contract: `PRODUCTION_LOCK.md`.
