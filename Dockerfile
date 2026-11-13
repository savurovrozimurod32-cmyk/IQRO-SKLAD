# IQRO SKLAD: 1C Excel ma'lumoti brauzerdan tashqariga chiqmaydi.
FROM nginx/nginx-unprivileged:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html iqro-ombor-tahlil.html xlsx.full.min.js turkum-qoidalari.json manifest.webmanifest sw.js icon-192.png icon-512.png /usr/share/nginx/html/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:8080/healthz | grep -qx ok || exit 1
