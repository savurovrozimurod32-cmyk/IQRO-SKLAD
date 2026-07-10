# IQRO — Javon to'ldirish ro'yxati

Sklad Kirimda qoldig'i bor, lekin Sklad IQRO javonida yo'q tovarlarni chiqaradi.
1C dan Excelga saqlangan qoldiq hisoboti bilan ishlaydi.

## Muhim: ma'lumot serverga yuborilmaydi

Excel fayl brauzerda o'qiladi va brauzerda qayta ishlanadi.
Server faqat sahifaning o'zini beradi. Ombor qoldig'i do'kondan chiqmaydi.

## Fayllar

| Fayl | Vazifasi |
|---|---|
| `index.html` | Dasturning o'zi |
| `xlsx.full.min.js` | Excel o'quvchi kutubxona (SheetJS) |
| `sw.js` | Internetsiz ishlash uchun |
| `manifest.webmanifest` | Ilova bo'lib o'rnatilishi uchun |
| `icon-192.png`, `icon-512.png` | Ikonka |

Hammasi statik. PHP, baza, backend yo'q.

---

## Joylashtirish — GitHub Pages (bepul)

1. GitHub'da yangi ombor (repository) oching: `iqro-ombor`. **Public** qiling.
2. Shu papkadagi barcha fayllarni yuklang (Add file → Upload files).
3. Settings → Pages → Source: `Deploy from a branch` → Branch: `main`, papka: `/ (root)` → Save.
4. 1–2 daqiqadan keyin manzil tayyor:
   `https://FOYDALANUVCHI.github.io/iqro-ombor/`

Ombor public bo'ladi, lekin ichida faqat dastur kodi turadi — hech qanday tovar ma'lumoti yo'q.

## Muqobil: Netlify Drop

`app.netlify.com/drop` ga shu papkani sudrab tashlang. Manzil darhol chiqadi.
Hisob ochmasangiz, manzil vaqtinchalik bo'ladi.

## Muqobil: do'konning ichki serveri

Papkani veb-serverga qo'ying. **HTTPS shart** — HTTPS'siz internetsiz ishlash (service worker) yoqilmaydi.
`localhost` istisno.

---

## Yangilash

`index.html` har safar tarmoqdan olinadi. Yangi versiyani yuklaganingizdan keyin
foydalanuvchi sahifani ochsa, pastda «Yangi versiya tayyor» tugmasi chiqadi.

Kutubxona va ikonkalar keshda saqlanadi. Ularni almashtirsangiz, `sw.js` dagi
`VERSIYA = 'iqro-v1'` ni `'iqro-v2'` ga o'zgartiring — aks holda eski nusxa qolib ketadi.

## Ilova bo'lib o'rnatish

Chrome/Edge: manzil satrida o'rnatish belgisi chiqadi.
Telefon: brauzer menyusi → «Bosh ekranga qo'shish».
O'rnatilgach internetsiz ochiladi.

---

## Ishlatish

1. 1C da qoldiq hisobotini oching, ikki sklad kesimida. Excelga saqlang (`.xlsx`, `.mxl` emas).
2. Saytni oching → «Faylni tanlash».
3. Yashil panelda qaysi list Kirim, qaysi biri IQRO ekanini tekshiring.
4. «Tekshirish kerak» yorlig'iga qarang. U yerda ko'p qator bo'lsa — eksport buzuq, ro'yxatga ishonmang.
5. «Chop etish» → varaqa. Ko'chirilgan tovarni belgilab boring.
6. 1C da tovar harakatini rasmiylashtiring.

## Nima buzilishi mumkin

- 1C qoldig'i 0 bo'lgan qatorlarni chiqarmasa, «Umuman yo'q» soni oshib ketadi. Bu yangi tovar emas, bo'sh javon.
- Guruh sarlavhasi va «Итого» qatorlari tovar deb hisoblanmaydi.
- Bir kod ikki qatorda kelsa qoldiqlar qo'shiladi.
- Miqdor raqam bo'lmasa, qator 0 deb hisoblanmaydi.

Har biri «Tekshirish kerak» ro'yxatiga yoziladi. Jim xato yo'q.
