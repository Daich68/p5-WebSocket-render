
---

# P5.js Animation Recorder  
✨ Захватывай магию анимаций в реальном времени! ✨  

Этот проект — крутой инструмент для создания и записи анимаций на базе **p5.js**, подкрепленный мощной серверной частью на **Node.js**. Готов к творчеству? Погнали!  

---

## Что это?  
Супер-система для генерации и записи анимаций с p5.js. Сервер на Node.js делает всю грязную работу:  

- 🔥 Захватывает кадры анимации прямо на лету  
- 💾 Сохраняет их в аккуратные последовательности  
- 🎥 Готовит данные для создания видеофайлов  
- 🎨 Работает с любой p5.js анимацией без лишних заморочек  

---

## Как это работает?  
1. **Клиент** (твой p5.js скрипт) рисует анимацию  
2. **frameSender.js** ловит каждый кадр и шлет его через WebSocket  
3. **Сервер** (server.js) принимает кадры, обрабатывает и кидает в папку `frames/`  
4. Кадры готовы? Конвертируй их в видео и наслаждайся!  

---

## Установка  
1. Клонируем репо:  
   ```bash  
   git clone https://github.com/your-username/p5js-animation-recorder.git  
   cd p5js-animation-recorder  
   ```  
2. Ставим зависимости:  
   ```bash  
   npm install  
   ```  

---

## Как юзать?  
1. Запускаем сервер:  
   ```bash  
   npm start  
   ```  
   Сервер готов ловить кадры через WebSocket.  

2. Подключаем к твоей анимации:  
   - Добавь `frameSender.js` в свой HTML  
   - Убедись, что в твоем p5.js скрипте есть функция `draw()`  
   - Открой анимацию в браузере — кадры сами полетят на сервер!  

---

## Структура проекта  
- `server.js` — сердце сервера, принимает и сохраняет кадры  
- `frameSender.js` — шпион, который отправляет кадры с клиента  
- `index.html` — стартовая страница с примером интеграции  
- `mySketch.js` — демо-анимация на p5.js  
- `mySketch copy.js` — запасной вариант анимации  
- `frames/` — уютное хранилище для твоих кадров  
- `style.css` — немного стиля для красоты  

---

## Настройка под себя  
Хочешь кастомизации? Открывай `server.js` и крути:  
- Формат картинок (PNG, JPG — решай сам)  
- Частота кадров (FPS на твой вкус)  
- Папка для сохранения (куда складывать шедевры?)  
- Сжатие (экономим место или гоним за качество)  

---

## Зависимости  
- **Node.js** — движок для серверной магии  
- **Express** — фреймворк для легкой работы с вебом  
- **ws** — WebSocket для мгновенной передачи данных  
- **p5.js** — твоя палитра для рисования анимаций  

---

## Лицензия  
ISC — делай что хочешь, но с умом!  

---

