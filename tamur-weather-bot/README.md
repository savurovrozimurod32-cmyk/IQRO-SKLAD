# TAMUR Weather Bot — Buxoro ob-havo

Har kuni soat **09:00 (Asia/Tashkent)** da Buxoro shahri uchun TAMUR Telegram
guruh(lar)iga **2 ta premium rasm** yuboradi:

1. **Kunlik ob-havo kartasi** (`daily-summary.png`) — bugungi kun to‘liq xulosasi.
2. **10 kunlik kutilayotgan ob-havo** (`weekly-forecast.png`) — bugun + 9 kun, harorat grafigi
   va **menejer tavsiyasi** (savdo uchun eng qulay kun + xodimlarga javob/dam maslahati).

Bu servis TAMUR kiyim savdosi uchun mo‘ljallangan — ob-havo savdoga ta’sir qiladi.
Boshqa biznes funksiyalari yo‘q.

---

## 1. Project purpose

- Har kuni 09:00 da avtomatik ishga tushadi (tashqi cron), 2 ta rasm yuboradi.
- **Kunlik karta:** katta ikon, kunduzgi/tungi harorat, condition, shamol, bosim,
  Tong/Kun/Oqshom haroratlari. (Namlik, oy fazasi, quyosh chiqishi/botishi ko'rsatilmaydi.)
- **10 kunlik:** har kun uchun ikon + max/min harorat, kunduzgi va tungi harorat
  chiziqlari (grafik), va pastda **menejer tavsiyasi** (deterministik, LLM yo‘q).
- Lokal Poppins font, vektor kunduz/tun ikonlar (internetdan yuklanmaydi).
- Rasmda manba nomi / URL / debug ko‘rsatilmaydi.

## 2. Architecture

```
src/
  config/env.ts          Zod bilan env validatsiya
  sources/
    weatherApiDaily.ts   WeatherAPI: kunlik xulosa (+ 10-kunlik fallback)
    openMeteoForecast.ts Open-Meteo: 10-kunlik (+ kunlik fallback)
    index.ts             getDailySummary / getWeeklyForecast (fallback bilan)
    metNorway.ts         Legacy adapter (production'da ishlatilmaydi)
  weather/
    types.ts             DailySummary, ForecastDay, WeeklyForecast
    conditions.ts        WMO / WeatherAPI kod -> canonical + o'zbekcha label
    astro.ts             oy fazasi (uz) + sunrise/sunset formati
    recommendation.ts    menejer tavsiyasi (deterministik ball)
    normalize.ts         sonli yordamchilar
    forecastSample.ts    preview/test fixture
  design/
    theme.ts, icons.ts   TAMUR navy+copper, vektor ikonlar (kunduz/tun)
    svg.ts               umumiy SVG + resvg->PNG rasterizatsiya
    renderDailyCard.ts   1080×1200 kunlik karta
    renderWeeklyCard.ts  1280×760 10-kunlik + menejer boksi
  telegram/sendPhoto.ts  sendPhoto (bir nechta guruh), admin xabar, retry
  jobs/dailyWeather.ts   fetch -> 2 rasm render -> Telegram (ketma-ket)
  scripts/               fetchTest, preview, sendTest, getUpdates
  index.ts               production entrypoint (npm run send:daily)
assets/fonts/            Poppins (OFL) — runtime'da internetdan yuklanmaydi
```

**Data manbalari:** WeatherAPI = kunlik karta (oy fazasi/bosim/astro bor);
Open-Meteo = 10 kunlik (bepul rejada 10 kun). Har biri ikkinchisi uchun fallback.
Final rasmlarda **manba nomlari ko‘rsatilmaydi**.

## 3. Requirements

- Node.js **20+** (22 tavsiya)
- npm
- Internet chiqishi: `api.weatherapi.com`, `api.open-meteo.com`, `api.telegram.org`

## 4. Installation

```bash
cd tamur-weather-bot
npm install
cp .env.example .env   # keyin .env ni to'ldiring
```

## 5. Environment variables

| O'zgaruvchi | Izoh |
|---|---|
| `WEATHER_CITY` | Shahar nomi (default `Buxoro`) |
| `WEATHER_LAT` / `WEATHER_LON` | Koordinatalar (default Buxoro) |
| `WEATHER_TIMEZONE` | `Asia/Tashkent` (server UTC bo'lsa ham shu ishlatiladi) |
| `WEATHERAPI_KEY` | WeatherAPI.com kaliti (kunlik karta uchun; bo'lmasa Open-Meteo fallback) |
| `TELEGRAM_BOT_TOKEN` | BotFather'dan olingan token |
| `TELEGRAM_CHAT_ID` | Guruh chat ID. **Bir nechta guruh** uchun vergul bilan: `-100aaa,-100bbb` |
| `ADMIN_CHAT_ID` | Ixtiyoriy: xatolik ogohlantirishlari shu chatga boradi |
| `REQUEST_TIMEOUT_MS` | Har bir so'rov timeouti (default `9000`) |
| `REQUEST_MAX_ATTEMPTS` | Har bir so'rov urinishlari (default `3`) |

> **Sirlar hech qachon git ga tushmaydi.** `.env` `.gitignore` da.

## 6. Local preview

```bash
npm run preview            # real data (imkonsiz bo'lsa fixture)
npm run preview -- --fixture   # doim namunaviy data
```

`output/daily-summary.png` va `output/weekly-forecast.png` yaratiladi.
Telegram ga hech narsa yuborilmaydi.

## 7. Telegram setup

1. [@BotFather](https://t.me/BotFather) da `/newbot` bilan bot yarating, tokenni `.env` ga qo'ying.
2. Botni TAMUR guruh(lar)iga qo'shing (kerak bo'lsa admin qiling).
3. Guruh chat ID ni oling (keyingi bo'lim). Bir nechta guruh bo'lsa vergul bilan yozing.

## 8. How to get Telegram group chat ID

```bash
npm run telegram:updates
```

Bot guruhga qo'shilgach va guruhga bitta xabar yozilgach, bu buyruq
chatlarning `title`, `id`, `type` sini ko'rsatadi (token/sir chiqmaydi).

## 9. WeatherAPI key setup

1. [weatherapi.com](https://www.weatherapi.com/) da bepul ro'yxatdan o'ting.
2. Dashboard'dan API key oling → `.env` da `WEATHERAPI_KEY=...`.

Key bo'lmasa kunlik karta Open-Meteo bilan chiziladi (bosim `—` bo'lishi mumkin).

## 10. Test

```bash
npm test          # avtomatik testlar (Vitest)
npm run typecheck # TypeScript tekshiruvi
npm run fetch:test  # kunlik + 10-kunlik + menejer tavsiyasini console'da ko'rsatadi
npm run send:test   # Telegram guruh(lar)ga real 2 rasmni yuboradi
```

## 11. Build

```bash
npm run build     # TypeScript -> dist/
npm start         # node dist/index.js
```

`npm run send:daily` esa `tsx` bilan bevosita ishlaydi (build shart emas).

## 12. Render Cron deployment

RUN-ONCE arxitektura: har kuni bir marta ishga tushadigan job.

**Vaqt:** `09:00 Asia/Tashkent = 04:00 UTC` (O'zbekistonda DST yo'q).

Render **Cron Job**:

- **Command:** `npm run send:daily` (endi 2 ta rasm yuboradi)
- **Schedule (UTC):** `0 4 * * *`
- **Environment:** `.env` qiymatlarini Render Environment sifatida qo'ying
  (`.env` faylini deploy qilmang).

Kamida 1 rasm yuborilsa job `exit 0`; umuman data kelmasa `exit 1` va admin
ogohlantiriladi.

## 13. Troubleshooting

| Belgi | Sabab / yechim |
|---|---|
| `Host not in allowlist` (403) | Server egress'ida ob-havo/telegram hostlari ochilmagan. |
| WeatherAPI `401/403` | `WEATHERAPI_KEY` noto'g'ri/muddati tugagan. Kunlik karta Open-Meteo bilan chiziladi. |
| Telegram `400` | `TELEGRAM_CHAT_ID` yoki token noto'g'ri; bot guruhga qo'shilganini tekshiring. |
| `post bloklandi` | Ikkala manbadan ham data kelmadi — noto'g'ri rasm yuborilmaydi. |
| Bir guruhga bormadi | `TELEGRAM_CHAT_ID` dagi shu id noto'g'ri yoki bot o'sha guruhda emas (log'da ko'rinadi). |
| Font/harflar noto'g'ri | `assets/fonts/` to'liq emas. |

---

## Dizayn eslatmasi

TAMUR navy/copper rang qiymatlari `src/design/theme.ts` da markazlashtirilgan.
Fontlar (Poppins) — SIL Open Font License, `assets/fonts/OFL.txt`.
