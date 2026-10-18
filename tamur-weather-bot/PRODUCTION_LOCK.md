# TAMUR Weather Bot — PRODUCTION LOCK

Status: **LOCKED / FINAL**

Bu fayl production contractni belgilaydi. Foydalanuvchining aniq yangi talabisiz quyidagi contract o'zgartirilmasin.

## O'zgarmas production contract

- Shahar: **Buxoro**
- Timezone: **Asia/Tashkent**
- Cron: **0 4 * * *** = har kuni **09:00 Uzbekistan vaqti**
- Har run: Telegramga **FAQAT 1 ta rasm** (`weekly-forecast.png`, 1280×980):
  **"10 KUNLIK KUTILAYOTGAN OB-HAVO"** (UI'da "bashorat" so'zi ishlatilmaydi):
  - 10 kun: har kun uchun hafta kuni + **SANA (DD.MM)** + ikon + kunduzgi/tungi harorat
  - kunduzgi va tungi harorat grafigi (chiziqlar)
  - **"Hafta oxiri savdo indeksi"** bloki (static, ob-havoga bog'liq emas):
    Juma +30%, Shanba +50%, Yakshanba +80% — past savdo kunlariga nisbatan
  - **MENEJER TAVSIYASI** boksi: qat'iy xodim qoidasi
    (**Shanba va Yakshanba — ob-havodan qat'i nazar xodimlarga javob berilmaydi**) +
    ob-havoga asoslangan deterministic tavsiya
  - Bugungi kunlik karta (daily-summary) **endi yuborilmaydi** (bitta rasm yetarli).
    (`renderDailyCard` moduli kodda saqlangan, lekin production oqimida ishlatilmaydi.)
- 10-day primary: Open-Meteo; fallback faqat to'liq 10 kun bera olsa qabul qilinadi
- Manager tavsiyasi deterministic scoring; LLM ishlatilmaydi.
  **Quyoshli kun = qulay; quyoshsiz/bulutli kun = salqin/sust** (clear > partly_cloudy > cloudy > …)
- **QAT'IY XODIM QOIDASI:** Shanba va Yakshanba kuni ob-havodan qat'i nazar xodimlarga
  javob berilmaydi. Ob-havo algoritmi bu ikki kunni hech qachon
  **"1 xodimga javob berish mumkin"** deb tavsiya qilmaydi. Javob berish mumkin bo'lgan
  sust kun faqat **Dushanba–Juma** oralig'idan tanlanadi.
- Production Telegram target: **FAQAT BITTA guruh**, `PRODUCTION_LOCK_CHAT_IDS` orqali lock qilinadi
  (hozirgi target: `-1002087046851`)
- Token/key hech qachon source yoki logga yozilmaydi

## Himoya qatlamlari

1. `assertProductionLock()` noto'g'ri city/timezone/coordinate/chat targetni fail-fast bloklaydi.
2. Render build `npm run build` orqali typecheck + test + compile o'tkazadi; test yiqilsa yangi deploy live bo'lmaydi.
3. GitHub CI har weather-bot o'zgarishida xuddi shu buildni qayta tekshiradi.
4. 10-kunlik output contract 10 kundan kam forecastni "10 kunlik" deb yuborishni bloklaydi.
5. Telegram yuborishda retry va mustaqil rasm error-handling saqlanadi.
6. Weekend policy regression testlari Shanba/Yakshanbaga "javob berish mumkin" tavsiyasi chiqishini bloklaydi.

## O'zgartirish tartibi

Production kodni faqat foydalanuvchi aniq o'zgartirish so'raganda oching. Har o'zgarishdan keyin:

1. `npm ci`
2. `npm run build`
3. previewlarni ko'rish
4. GitHub push
5. Render deploy PASS
6. Trigger Run
7. rasm kerakli guruhga tushganini tekshirish

Shularning biri PASS bo'lmasa production final deb hisoblanmaydi.
