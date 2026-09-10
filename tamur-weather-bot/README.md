# TAMUR Weather Bot — Buxoro ob-havo

Har kuni soat **09:00 (Asia/Tashkent)** da Buxoro shahri uchun **2 mustaqil
manbaning bugungi SOATBAY prognozini** (09:00–23:00) oladi va ularni bitta uzun
premium PNG **jadval** ichida TAMUR Telegram guruhiga avtomatik yuboradi.

> **Muhim:** manbalar **median/consensus qilinmaydi va birlashtirilmaydi**.
> Har soat uchun Open-Meteo va WeatherAPI qiymatlari **alohida ustunda** ko'rinadi
> — foydalanuvchi 2 prognozni yonma-yon taqqoslaydi.
>
> MET Norway adapteri kodda saqlangan (`src/sources/metNorway.ts`), lekin
> **production oqimidan chiqarilgan** — endi faqat Open-Meteo + WeatherAPI.

Bu servis **faqat ob-havo** uchun. Savdo, analitika yoki boshqa biznes
funksiyalari yo'q.

---

## 1. Project purpose

- Har kuni 09:00 da avtomatik ishga tushadi (tashqi cron).
- 2 manba: Open-Meteo va WeatherAPI.com — nomlari rasmda **ko'rsatiladi** (ustun
  sarlavhasi). URL/debug/raw ma'lumot ko'rsatilmaydi.
- **Soatbay jadval:** 09:00–23:00 = 15 qator. Har soat: vaqt · temperatura ·
  condition (ikon) · yomg'ir ehtimoli · shamol. Merge/consensus YO'Q.
- Katta "current" hero temperatura YO'Q — asosiy element jadval.
- 1080×2400 uzun PNG (TAMUR navy+copper, lokal Poppins font, vektor kunduz/tun ikonlar).
- Telegram `sendPhoto` orqali yuborish, retry va admin ogohlantirish bilan.
- **Failure qoidasi:** 2/2 yoki 1/2 — ishlagan manba ustuni real data, ikkinchisida
  "Ma'lumot olinmadi". Faqat **0/2** bo'lsa rasm yuborilmaydi.

## 2. Architecture

```
src/
  config/env.ts          Zod bilan env validatsiya
  sources/               openMeteoHourly, weatherApiHourly + http (timeout/retry)
                         + index (fetchHourlySources, shouldSend)
                         metNorway.ts — saqlangan, lekin production'da ishlatilmaydi
  weather/               types (Hourly* modellar), conditions (mapping),
                         hourly (09:00–23:00 oyna, yordamchilar), normalize,
                         hourlySample (preview/test fixture)
  design/                theme (rang), icons (vektor SVG, tun/moon),
                         renderHourlyCard (2 ustunli jadval -> SVG -> PNG)
  telegram/sendPhoto.ts  sendPhoto + admin xabar, retry bilan
  jobs/dailyWeather.ts   to'liq oqim: fetch hourly -> jadval render -> telegram
  scripts/               fetchTest, preview, sendTest, getUpdates
  index.ts               production entrypoint (npm run send:daily)
assets/fonts/            Poppins (OFL) — runtime'da internetdan yuklanmaydi
```

Oqim: **2 manba soatbay fetch → normalize → jadval render → PNG → Telegram**.

## 3. Requirements

- Node.js **20+** (22 tavsiya etiladi)
- npm
- Internet chiqishi: `api.open-meteo.com`, `api.weatherapi.com`, `api.telegram.org`

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
| `WEATHERAPI_KEY` | WeatherAPI.com kaliti (bo'sh bo'lsa faqat Open-Meteo ishlaydi = 1/2, post baribir yuboriladi) |
| `MET_USER_AGENT` | (Legacy) MET Norway adapteri uchun; production'da ishlatilmaydi |
| `TELEGRAM_BOT_TOKEN` | BotFather'dan olingan token |
| `TELEGRAM_CHAT_ID` | Guruh chat ID (odatda `-100...`) |
| `ADMIN_CHAT_ID` | Ixtiyoriy: xatolik ogohlantirishlari shu chatga boradi |
| _(threshold yo'q)_ | Qoida kodda qat'iy: faqat **0/2** bo'lsa yuborilmaydi |
| `REQUEST_TIMEOUT_MS` | Har bir so'rov timeouti (default `9000`) |
| `REQUEST_MAX_ATTEMPTS` | Har bir so'rov urinishlari (default `3`) |

> **Sirlar hech qachon git ga tushmaydi.** `.env` `.gitignore` da.

## 6. Local preview

```bash
npm run preview             # real ob-havo (imkonsiz bo'lsa fixture) -> output/preview.png
npm run preview -- --fixture    # doim namunaviy ma'lumot bilan
npm run preview -- --variants   # 2/2 va 1/2 failure variantlari -> output/preview-*of2.png
```

`output/preview*.png` yaratiladi. Telegram ga hech narsa yuborilmaydi.

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

Key bo'lmasa — servis yiqilmaydi, faqat Open-Meteo bilan (1/2) ishlaydi va post baribir yuboriladi.

## 10. Test

```bash
npm test          # barcha avtomatik testlar (Vitest)
npm run typecheck # TypeScript tekshiruvi
npm run fetch:test  # 2 manbadan real SOATBAY prognozni olib console'da ko'rsatadi
npm run send:test   # Telegram guruhga TEST soatbay jadval yuboradi (kamida 1 real manba shart)
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
| WeatherAPI `401/403` | `WEATHERAPI_KEY` noto'g'ri/muddati tugagan. Open-Meteo baribir 1/2 bilan ishlaydi. |
| Telegram `400` | `TELEGRAM_CHAT_ID` yoki token noto'g'ri. Botni guruhga qo'shganingizni tekshiring. |
| `post bloklandi` | 0/2 manba ishladi — bu ataylab: bo'sh/noto'g'ri rasm yuborilmaydi. |
| Font/harflar noto'g'ri | `assets/fonts/` to'liq emas. Poppins TTF fayllari joyida ekanini tekshiring. |
| Rasm buzuq | Render fail — bunday holatda Telegram ga yuborilmaydi (log'ga qarang). |

---

## Ishlab chiqilishi (dizayn eslatmasi)

TAMUR navy/copper rang qiymatlari `src/design/theme.ts` da markazlashtirilgan.
Rasmiy brend HEX kodlari tasdiqlangach, faqat shu faylni yangilash kifoya.

Fontlar (Poppins) — SIL Open Font License, `assets/fonts/OFL.txt`.
