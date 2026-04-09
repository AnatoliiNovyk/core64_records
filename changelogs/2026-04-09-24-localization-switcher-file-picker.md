# 2026-04-09-24 Localization Switcher and File Picker Fix

## Як було

- У public language switcher відображалися змішані ярлики (`Укр/Eng` або `Ukr/Eng`), що виглядало непослідовно.
- У contact form для `input[type=file]` рендерився системний текст браузера/ОС (`Вибрати файл`, `Файл не вибрано`), який не контролювався i18n словником сайту.
- Через нативний file input було неможливо гарантувати 100% локалізований вигляд в обох мовах UI.

## Що зроблено

- Оновлено i18n-ярлики language switcher у [app.js](app.js):
  - `languageLabelUk` -> `UK`
  - `languageLabelEn` -> `EN`
- Додано нові i18n ключі для contact file picker у [app.js](app.js):
  - `contactFileSelectButton`
  - `contactFileNoFile`
- Замінено видиму частину нативного file input на кастомний локалізований picker у [index.html](index.html):
  - прихований `input[type=file]` для сумісності з існуючим submit-flow;
  - локалізована кнопка вибору файлу;
  - локалізований текст стану файлу (no file / selected filename).
- Додано JS-логіку в [app.js](app.js):
  - синхронізація тексту стану файлу при `change`;
  - запуск file dialog через кастомну кнопку;
  - reset тексту стану після успішного submit/reset форми.

## Що покращило/виправило/додало

- Уніфіковано підписи мовного перемикача до чіткого формату `UK/EN`.
- Прибрано залежність видимого file picker UI від мови браузера/ОС.
- Локалізація contact форми стала повністю контрольованою через словник застосунку.
