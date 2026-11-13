# IQRO SKLAD — VPS tayyorlov

Bu tarmoq faqat sinov uchun. Hozirgi GitHub Pages / Netlify manzili o'zgartirilmaydi.

## Texnik faktlar

- Sayt 100% statik. Backend, PostgreSQL yoki Supabase kerak emas.
- Excel ma'lumotlari foydalanuvchi brauzerida qoladi. VPS'ga yuklanmaydi.
- NGINX container root huquqisiz ishlaydi, ichki port **8080**.
- `/healthz` → `ok`.

## Coolify sinovi

1. Coolify'ga GitHub reposini ulab, `vps-migration/iqro-sklad` tarmog'ini tanlang.
2. Dockerfile bilan build qiling; port **8080**, vaqtinchalik HTTPS test-domen.
3. Sahifani oching; test Excel yuklang va hisob-kitobni solishtiring.
4. PWA/offline rejimini tekshiring: servis worker faqat HTTPS yoki localhost'da ishlaydi.
5. Ko'chirish yakunida domenni almashtirish va eski xizmatni o'chirish alohida tasdiqni talab qiladi.

## Xavfsizlik

Maxfiy 1C Excel fayllarini GitHub yoki Docker image ichiga qo'shmang. Bu Dockerfile faqat foydalanuvchi interfeysini ko'chiradi.

## Holat

GitHub konfiguratsiyasi tayyor. Docker build, VPS va foydalanuvchi testlari hali o'tkazilmagan.
