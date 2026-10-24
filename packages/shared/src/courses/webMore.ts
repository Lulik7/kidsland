import type { Course } from './types';

export const webMidCourse: Course = {
  id: 'web-mid',
  subject: 'web',
  level: 'intermediate',
  title: 'Сайты: вёрстка и блоки',
  tagline: 'Классы, блоки и раскладка Flexbox',
  description:
    'Для тех, кто знает основные теги и пару свойств CSS. Научимся группировать элементы в блоки, задавать им классы и раскладывать карточки в ряд.',
  ageMin: 10,
  ageMax: 14,
  color: '#ff6680',
  lessons: [
    {
      id: 'web-mid-1',
      title: 'Классы и блоки div',
      minutes: 15,
      sections: [
        {
          title: 'Блок div',
          text: 'Тег <div> это пустая коробка, в которую складывают другие теги. Из таких коробок собирают шапку, меню, карточки и подвал сайта.',
          code: '<div class="card">\n  <h2>Мой кот</h2>\n  <p>Любит спать.</p>\n</div>',
        },
        {
          title: 'Классы',
          text: 'Атрибут class даёт элементу имя для CSS. В CSS к классу обращаются через точку. Один класс можно дать многим элементам, и все они станут одинаковыми.',
          code: '.card {\n  background: white;\n  padding: 16px;\n  border-radius: 12px;\n}',
          tip: 'padding это отступ внутри блока, margin это отступ снаружи.',
        },
      ],
      practice: [
        {
          id: 'wm1-p1',
          kind: 'text',
          prompt: 'Какой символ ставят перед именем класса в CSS?',
          answer: ['.', 'точка', 'точку'],
        },
        {
          id: 'wm1-p2',
          kind: 'single',
          prompt: 'Какое свойство делает отступ внутри блока, между рамкой и текстом?',
          options: ['margin', 'padding', 'border'],
          answer: 1,
        },
      ],
      quiz: [
        {
          id: 'wm1-q1',
          kind: 'single',
          prompt: 'Для чего нужен тег <div>?',
          options: ['Чтобы группировать другие элементы', 'Чтобы сделать ссылку', 'Чтобы вставить видео'],
          answer: 0,
        },
        {
          id: 'wm1-q2',
          kind: 'single',
          prompt: 'Как правильно написать селектор для class="hero"?',
          options: ['#hero', '.hero', 'hero()'],
          answer: 1,
        },
        {
          id: 'wm1-q3',
          kind: 'single',
          prompt: 'Что делает border-radius: 12px?',
          options: ['Скругляет углы', 'Делает рамку толще', 'Поворачивает блок'],
          answer: 0,
        },
      ],
    },
    {
      id: 'web-mid-2',
      title: 'Flexbox: раскладываем в ряд',
      minutes: 15,
      sections: [
        {
          title: 'display: flex',
          text: 'Если родительскому блоку написать display: flex, его дети встанут в ряд. gap задаёт расстояние между ними.',
          code: '.cards {\n  display: flex;\n  gap: 16px;\n}',
        },
        {
          title: 'Выравнивание',
          text: 'justify-content выравнивает элементы вдоль ряда (center ставит по центру, space-between разносит по краям). align-items выравнивает по высоте. flex-wrap: wrap переносит карточки на новую строку, если не хватает места.',
          tip: 'flex-direction: column ставит элементы в столбик.',
        },
      ],
      practice: [
        {
          id: 'wm2-p1',
          kind: 'text',
          prompt: 'Допиши: display: … — чтобы дети блока встали в ряд.',
          answer: ['flex'],
        },
        {
          id: 'wm2-p2',
          kind: 'order',
          prompt: 'Собери правило: карточки в ряд, по центру, с промежутком 20px.',
          items: ['.cards {', '  display: flex;', '  justify-content: center;', '  gap: 20px;', '}'],
        },
      ],
      quiz: [
        {
          id: 'wm2-q1',
          kind: 'single',
          prompt: 'Какое свойство задаёт расстояние между элементами во flex?',
          options: ['gap', 'space', 'margin-flex'],
          answer: 0,
        },
        {
          id: 'wm2-q2',
          kind: 'single',
          prompt: 'Что сделает flex-wrap: wrap?',
          options: ['Перенесёт элементы на новую строку, если не помещаются', 'Спрячет лишние элементы', 'Повернёт ряд'],
          answer: 0,
        },
        {
          id: 'wm2-q3',
          kind: 'single',
          prompt: 'Как поставить элементы flex в столбик?',
          options: ['flex-direction: column', 'display: column', 'align-items: column'],
          answer: 0,
        },
      ],
    },
  ],
  faq: [
    { q: 'Как посмотреть, из каких блоков сделан любой сайт?', a: 'Нажми на странице правой кнопкой и выбери «Просмотреть код» (или клавишу F12). Откроются инструменты разработчика.' },
    { q: 'Почему мои стили не применяются?', a: 'Проверь, совпадает ли имя класса в HTML и CSS, есть ли точка перед классом и точки с запятой после свойств.' },
    { q: 'Что дальше?', a: 'Курс «JavaScript: живые страницы» продвинутого уровня.' },
  ],
};

export const webProCourse: Course = {
  id: 'web-pro',
  subject: 'web',
  level: 'advanced',
  title: 'JavaScript: живые страницы',
  tagline: 'Переменные, функции и реакция на клики',
  description:
    'Для тех, кто уверенно верстает. Научимся писать на JavaScript: хранить данные, делать функции и менять страницу, когда пользователь нажимает кнопки.',
  ageMin: 11,
  ageMax: 15,
  color: '#ff6680',
  lessons: [
    {
      id: 'web-pro-1',
      title: 'Переменные и функции в JS',
      minutes: 15,
      sections: [
        {
          title: 'let и const',
          text: 'let создаёт переменную, которую можно менять, const создаёт постоянную. console.log выводит значение в консоль браузера (F12).',
          code: 'let score = 0;\nscore = score + 10;\nconst name = "Kidsland";\nconsole.log(name, score);',
        },
        {
          title: 'Функции',
          text: 'Функцию объявляют словом function. Как и в Python, она может принимать параметры и возвращать результат через return.',
          code: 'function greet(who) {\n  return "Привет, " + who + "!";\n}\nconsole.log(greet("Маша"));',
          tip: 'В JS строки команд принято заканчивать точкой с запятой.',
        },
      ],
      practice: [
        {
          id: 'wp1-p1',
          kind: 'text',
          prompt: 'Что выведет console.log?',
          code: 'let a = 5;\na = a * 3;\nconsole.log(a);',
          answer: ['15'],
        },
        {
          id: 'wp1-p2',
          kind: 'single',
          prompt: 'Какой способ подходит для значения, которое никогда не меняется?',
          options: ['let', 'const', 'var change'],
          answer: 1,
        },
      ],
      quiz: [
        {
          id: 'wp1-q1',
          kind: 'single',
          prompt: 'Где увидеть результат console.log?',
          options: ['В консоли браузера (F12)', 'На странице крупным шрифтом', 'Нигде'],
          answer: 0,
        },
        {
          id: 'wp1-q2',
          kind: 'single',
          prompt: 'Каким словом объявляют функцию в JavaScript?',
          options: ['def', 'function', 'func'],
          answer: 1,
        },
        {
          id: 'wp1-q3',
          kind: 'single',
          prompt: 'Что вернёт функция?',
          code: 'function f(x) {\n  return x + 1;\n}\nf(9);',
          options: ['10', '91', '9'],
          answer: 0,
        },
      ],
    },
    {
      id: 'web-pro-2',
      title: 'События и изменение страницы',
      minutes: 15,
      sections: [
        {
          title: 'Находим элемент',
          text: 'document.querySelector находит элемент на странице по селектору, как в CSS. У найденного элемента можно поменять текст через textContent.',
          code: 'const title = document.querySelector("#title");\ntitle.textContent = "Новый заголовок";',
        },
        {
          title: 'Реагируем на клик',
          text: 'addEventListener("click", функция) говорит: когда по элементу кликнут, выполнить функцию. Так делают счётчики, игры и меню.',
          code: 'let clicks = 0;\nconst btn = document.querySelector("#btn");\nbtn.addEventListener("click", () => {\n  clicks = clicks + 1;\n  btn.textContent = "Кликов: " + clicks;\n});',
        },
      ],
      practice: [
        {
          id: 'wp2-p1',
          kind: 'text',
          prompt: 'Какое событие происходит, когда по кнопке нажимают мышкой? Напиши его название для addEventListener.',
          answer: ['click'],
        },
        {
          id: 'wp2-p2',
          kind: 'order',
          prompt: 'Собери код: по клику на кнопку заголовок меняется на «Ура!».',
          items: ['const btn = document.querySelector("#btn");', 'const title = document.querySelector("#title");', 'btn.addEventListener("click", () => {', '  title.textContent = "Ура!";', '});'],
        },
      ],
      quiz: [
        {
          id: 'wp2-q1',
          kind: 'single',
          prompt: 'Что делает document.querySelector("#title")?',
          options: ['Находит элемент с id="title"', 'Создаёт новый заголовок', 'Удаляет заголовок'],
          answer: 0,
        },
        {
          id: 'wp2-q2',
          kind: 'single',
          prompt: 'Как поменять текст элемента el?',
          options: ['el.textContent = "…"', 'el.color = "…"', 'el.click()'],
          answer: 0,
        },
        {
          id: 'wp2-q3',
          kind: 'single',
          prompt: 'Кнопку нажали 3 раза. Что на ней написано после кода из урока?',
          options: ['Кликов: 3', 'Кликов: 0', 'Кликов: 1'],
          answer: 0,
        },
      ],
    },
  ],
  faq: [
    { q: 'Java и JavaScript это одно и то же?', a: 'Нет, это разные языки с похожими названиями. JavaScript работает прямо в браузере.' },
    { q: 'Где тренироваться?', a: 'На codepen.io или jsfiddle.net: слева пишешь HTML, CSS и JS, справа сразу видишь результат.' },
    { q: 'Что делать дальше?', a: 'Сделай свою мини-игру в браузере: кликер или викторину. Наставник поможет опубликовать её в интернете.' },
  ],
};
