# TAMUR Weather Bot — Buxoro ob-havo

Har kuni soat **09:00 (Asia/Tashkent)** da Buxoro shahri uchun 3 ta mustaqil
ob-havo manbasidan ma'lumot olib, ularni umumlashtirib (consensus), professional
PNG karta yaratadi va TAMUR Telegram guruhiga avtomatik yuboradi.

Bu servis **faqat ob-havo** uchun. Savdo, analitika yoki boshqa biznes
funksiyalari yo'q.

---

## 1. Project purpose

- Har kuni 09:00 da avtomatik ishga tushadi (tashqi cron).
- 3 manba: Open-Meteo, MET Norway, WeatherAPI.com (nomlari rasmda **ko'rsatilmaydi**).
- Median asosidagi consensus (outlierlarga chidamli).
- 1080×1350 PNG karta (TAMUR dizayn tizimi, lokal Poppins font, vektor ikonlar).
- Telegram `sendPhoto` orqali yuborish, retry va admin ogohlantirish bilan.
- Kamida 2 manba ishlamasa — **rasm yuborilmaydi** (noto'g'ri prognozdan ko'ra yubormaslik afzal).

## 2. Architecture

```
src/
  config/env.ts          Zod bilan env validatsiya
  sources/               3 provider adapter (openMeteo, metNorway, weatherApi) + http (timeout/retry)
  weather/               types, conditions (mapping), normalize (median va boshqalar),
                         consensus (median + condition voting), summary (o'zbekcha)
  design/                theme (rang/o'lcham), icons (vektor SVG), renderWeatherCard (SVG->PNG)
  telegram/sendPhoto.ts  sendPhoto + admin xabar, retry bilan
  jobs/dailyWeather.ts   to'liq oqim: fetch -> consensus -> render -> telegram
  scripts/               fetchTest, preview, sendTest, getUpdates
  index.ts               production entrypoint (npm run send:daily)
assets/fonts/            Poppins (OFL) — runtime'da internetdan yuklanmaydi
```

Oqim: **providerlar → consensus → PNG → Telegram**. Har bir qatlam mustaqil.

## 3. Requirements

- Node.js **20+** (22 tavsiya etiladi)
- npm
- Internet chiqishi: `api.open-meteo.com`, `api.met.no`, `api.weatherapi.com`, `api.telegram.org`

## 4. Installation

```bash
cd tamur-weather-bot
npm install
cp .env.example .env   # keyin .env ni to'ldiring
```

## 5. Environment variables

`.env.example` dan nusxa oling. Muhim qiymatlar:

| O'zgaruvchi | Izoh |
|---|---|
| `WEATHER_CITY` | Shahar nomi (default `Buxoro`) |
| `WEATHER_LAT` / `WEATHER_LON` | Koordinatalar (default Buxoro) |
| `WEATHER_TIMEZONE` | `Asia/Tashkent` (server UTC bo'lsa ham shu ishlatiladi) |
| `WEATHERAPI_KEY` | WeatherAPI.com kaliti (bo'sh bo'lsa bu provider o'chadi) |
| `MET_USER_AGENT` | MET Norway uchun **haqiqiy aloqali** User-Agent (majburiy) |
| `TELEGRAM_BOT_TOKEN` | BotFather'dan olingan token |
| `TELEGRAM_CHAT_ID` | Guruh chat ID (odatda `-100...`) |
| `ADMIN_CHAT_ID` | Ixtiyoriy: xatolik ogohlantirishlari shu chatga boradi |
| `MIN_SUCCESSFUL_SOURCES` | Kamida nechta manba kerak (default `2`) |
| `REQUEST_TIMEOUT_MS` | Har bir so'rov timeouti (default `9000`) |
| `REQUEST_MAX_ATTEMPTS` | Har bir so'rov urinishlari (default `3`) |

> **Sirlar hech qachon git ga tushmaydi.** `.env` `.gitignore` da.

## 6. Local preview

```bash
npm run preview            # real ob-havo (imkonsiz bo'lsa fixture) -> output/preview.png
npm run preview -- --fixture   # doim namunaviy ma'lumot bilan
```

`output/preview.png` yaratiladi. Telegram ga hech narsa yuborilmaydi.

## 7. Telegram setup

1. [@BotFather](https://t.me/BotFather) da `/newbot` bilan bot yarating, tokenni `.env` ga qo'ying.
2. Botni TAMUR guruhiga qo'shing (kerak bo'lsa admin qiling).
3. Guruh chat ID ni oling (keyingi bo'lim).

## 8. How to get Telegram group chat ID

```bash
npm run telegram:updates
```

Bot guruhga qo'shilgach va guruhga bitta xabar yozilgach, bu buyruq
chatlarning `title`, `id`, `type` sini ko'rsatadi (token/sir chiqmaydi).
`type: group`/`supergroup` bo'lgan `id` ni `TELEGRAM_CHAT_ID` ga yozing.

## 9. WeatherAPI key setup

1. [weatherapi.com](https://www.weatherapi.com/) da ro'yxatdan o'ting (bepul reja bor).
2. Dashboard'dan API key oling.
3. `.env` da `WEATHERAPI_KEY=...` qiling.

Key bo'lmasa — servis yiqilmaydi, faqat 2 manba (Open-Meteo + MET Norway) bilan ishlaydi.

## 10. Test

```bash
npm test          # barcha avtomatik testlar (Vitest)
npm run typecheck # TypeScript tekshiruvi
npm run fetch:test  # 3 providerdan real ma'lumot olib console'da normalize natijani ko'rsatadi
npm run send:test   # Telegram guruhga TEST kartasi yuboradi (real yoki fixture)
```

## 11. Build

```bash
npm run build     # TypeScript -> dist/
npm start         # node dist/index.js (kompilyatsiya qilingan variant)
```

`npm run send:daily` esa `tsx` bilan bevosita ishlaydi (build shart emas).

## 12. Render Cron deployment

Production uchun **RUN-ONCE** arxitektura: doimiy server emas, har kuni bir marta
ishga tushadigan job.

**Vaqt:** `09:00 Asia/Tashkent = 04:00 UTC` (O'zbekistonda DST yo'q, doim UTC+5).

Render **Cron Job** sozlamalari:

- **Command:** `npm run send:daily`
- **Schedule (UTC):**

  ```cron
  0 4 * * *
  ```

- **Environment:** yuqoridagi barcha `.env` qiymatlarini Render Environment
  sifatida qo'ying (`.env` faylini deploy qilmang).

> Kod ichida sana/vaqt **har doim `Asia/Tashkent`** bo'yicha hisoblanadi —
> server timezonega tayanmaydi.

Muvaffaqiyatli yuborilsa job `exit 0`, yuborilmasa (yetarli manba yo'q / xato)
`exit 1` bilan tugaydi va admin (agar sozlangan bo'lsa) ogohlantiriladi.

## 13. Troubleshooting

| Belgi | Sabab / yechim |
|---|---|
| `Host not in allowlist` (403) | Server egress'ida ob-havo/telegram hostlari ochilmagan. Hostlarni ruxsat bering. |
| MET Norway `403` | `MET_USER_AGENT` noto'g'ri yoki bo'sh. Haqiqiy aloqali User-Agent qo'ying. |
| WeatherAPI `401/403` | `WEATHERAPI_KEY` noto'g'ri/muddati tugagan. |
| Telegram `400` | `TELEGRAM_CHAT_ID` yoki token noto'g'ri. Botni guruhga qo'shganingizni tekshiring. |
| `post bloklandi: Yetarli manba yo'q` | 2 dan kam manba ishladi — bu ataylab: noto'g'ri prognoz yuborilmaydi. |
| Font/harflar noto'g'ri | `assets/fonts/` to'liq emas. Poppins TTF fayllari joyida ekanini tekshiring. |
| Rasm buzuq | Render fail — bunday holatda Telegram ga yuborilmaydi (log'ga qarang). |

---

## Ishlab chiqilishi (dizayn eslatmasi)

TAMUR navy/copper rang qiymatlari `src/design/theme.ts` da markazlashtirilgan.
Rasmiy brend HEX kodlari tasdiqlangach, faqat shu faylni yangilash kifoya.

Fontlar (Poppins) — SIL Open Font License, `assets/fonts/OFL.txt`.
