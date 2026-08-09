# Trading Journal — Guía para tenerlo en tu computadora (Windows)

[![CI](https://github.com/norkelisbvt/Tradingjournal/actions/workflows/ci.yml/badge.svg)](https://github.com/norkelisbvt/Tradingjournal/actions/workflows/ci.yml)

## ⚠️ Importante sobre la ventana que abriste
Esa ventana negra que dice "Welcome to Node.js v24.17.0" y tiene un `>` es la
**consola interactiva de Node (REPL)**, no una terminal normal. Ahí no puedes
correr comandos como `npm install`. Ciérrala o escribe `.exit` y dale Enter.

Lo que necesitas es abrir una **terminal normal**:
- Busca "cmd" o "PowerShell" en el buscador de Windows (el ícono de lupa que
  ya tienes abierto abajo) y ábrelo.
- Ahí sí vas a ver algo como `C:\Users\TuUsuario>` — esa es la terminal correcta.

## 1. Requisitos (ya los tienes ✅)
Node.js ya está instalado (v24.17.0). Perfecto.

## 2. Descomprime esta carpeta
Guárdala en un lugar fijo, por ejemplo:
`C:\Users\TuUsuario\Documents\trading-journal`

## 3. Entra a la carpeta desde la terminal
En CMD o PowerShell:
```
cd C:\Users\TuUsuario\Documents\trading-journal
```
(ajusta la ruta a donde la hayas descomprimido)

## 4. Instala las dependencias
```
npm install
```
Esto descarga React, Vite y Electron (tarda 1-2 minutos, solo la primera vez).

## 5. Correr la app en modo desarrollo (ventana de escritorio)
```
npm run electron:dev
```
Se abrirá la ventana "Trading Journal" igual que en tus capturas. Deja esta
terminal abierta mientras trabajas.

## 6. Generar el instalador/ejecutable .exe (para usarlo sin terminal)
```
npm run electron:build
```
Al terminar, busca la carpeta `dist` — ahí encontrarás:
- Un instalador `.exe` (NSIS) — lo ejecutas una vez y te crea acceso directo.
- Una versión `Portable` — un solo `.exe` que corres directo, sin instalar.

## 7. ¿Dónde se guardan tus datos? ✅ Ya implementado
Tus trades, tus cuentas (Personal/Fondeo) y tu lista de razones personalizadas
**ahora se guardan automáticamente** en un archivo JSON en tu computadora,
en esta ubicación:

```
%APPDATA%\trading-journal\trading-journal-data.json
```
(pega esa ruta con `%APPDATA%` incluido en el explorador de Windows para verla)

Cada vez que agregas, editas o borras un trade, la app lo guarda solo (verás
un indicador "💾 Guardando…" y luego "✓ Guardado" arriba a la derecha). La
próxima vez que abras la app, tus datos reales se cargan automáticamente en
vez de los datos de ejemplo (demo).

Si algún día quieres respaldar tu información, solo copia ese archivo
`trading-journal-data.json` a otro lugar (USB, nube, etc.). Para restaurarlo,
lo vuelves a poner en esa misma carpeta.

## Estructura del proyecto
```
trading-journal/
├── package.json
├── vite.config.js
├── index.html
├── electron/
│   ├── main.js          ← ventana de Electron + guardado en archivo
│   └── preload.js       ← puente seguro entre la app y el guardado
└── src/
    ├── main.jsx          ← arranca React
    └── TradingJournal.jsx ← tu app (el código que editamos en el chat)
```

Cuando quieras que te ajuste algo más, edita `src/TradingJournal.jsx`
(o pídeme el cambio y yo te doy el archivo actualizado para reemplazar aquí).

