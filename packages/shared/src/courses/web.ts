import type { Course } from './types';

export const webCourse: Course = {
  id: 'web',
  subject: 'web',
  level: 'beginner',
  title: 'Мой первый сайт',
  tagline: 'HTML, CSS и немного JavaScript',
  description:
    'Каждый сайт в интернете сделан из HTML (что показать), CSS (как это выглядит) и JavaScript (как это работает). Сделаем страничку о своём хобби.',
  ageMin: 8,
  ageMax: 13,
  color: '#ff6680',
  lessons: [
    {
      id: 'web-1',
      title: 'HTML: из чего сделана страница',
      minutes: 12,
      sections: [
        {
          title: 'Теги',
          text: 'HTML состоит из тегов в угловых скобках. Большинство тегов парные: открывающий <h1> и закрывающий </h1> с косой чертой. Всё, что между ними, это содержимое.',
          code: '<h1>Мой кот Барсик</h1>\n<p>Барсик любит спать на клавиатуре.</p>',
        },
        {
          title: 'Самые нужные теги',
          text: '<h1> это главный заголовок, <h2> заголовок поменьше, <p> абзац текста, <ul> и <li> список, <b> жирный текст. Браузер читает теги и рисует страницу.',
          tip: 'Сохрани код в файл index.html и открой его в браузере: это уже сайт.',
        },
      ],
      practice: [
        {
          id: 'w1-p1',
          kind: 'text',
          prompt: 'Каким тегом закрывают абзац, открытый тегом <p>?',
          answer: ['</p>'],
          placeholder: '<…>',
        },
        {
          id: 'w1-p2',
          kind: 'order',
          prompt: 'Собери список любимых игр.',
          items: ['<ul>', '  <li>Minecraft</li>', '  <li>Kidsland</li>', '</ul>'],
          explain: 'Пункты <li> всегда лежат внутри <ul>.',
        },
      ],
      quiz: [
        {
          id: 'w1-q1',
          kind: 'single',
          prompt: 'Какой тег делает самый крупный заголовок?',
          options: ['<p>', '<h1>', '<li>'],
          answer: 1,
        },
        {
          id: 'w1-q2',
          kind: 'single',
          prompt: 'Чем закрывающий тег отличается от открывающего?',
          options: ['Косой чертой /', 'Восклицательным знаком', 'Ничем'],
          answer: 0,
        },
        {
          id: 'w1-q3',
          kind: 'single',
          prompt: 'За что отвечает HTML?',
          options: ['За цвета и шрифты', 'За содержимое страницы', 'За анимации'],
          answer: 1,
        },
      ],
    },
    {
      id: 'web-2',
      title: 'CSS: делаем красиво',
      minutes: 12,
      sections: [
        {
          title: 'Правила CSS',
          text: 'CSS говорит браузеру, как выглядят теги. Правило состоит из селектора (какие теги) и свойств в фигурных скобках. Каждое свойство заканчивается точкой с запятой.',
          code: 'h1 {\n  color: orange;\n  font-size: 40px;\n}\nbody {\n  background: lightyellow;\n}',
        },
        {
          title: 'Полезные свойства',
          text: 'color это цвет текста, background это цвет фона, font-size это размер шрифта, text-align: center ставит текст по центру, border рисует рамку.',
          tip: 'Цвета можно писать словами (red, blue) или кодами вроде #ff6b3d.',
        },
      ],
      practice: [
        {
          id: 'w2-p1',
          kind: 'text',
          prompt: 'Какое свойство CSS меняет цвет текста?',
          answer: ['color'],
        },
        {
          id: 'w2-p2',
          kind: 'order',
          prompt: 'Собери правило, которое делает все абзацы синими и по центру.',
          items: ['p {', '  color: blue;', '  text-align: center;', '}'],
        },
      ],
      quiz: [
        {
          id: 'w2-q1',
          kind: 'single',
          prompt: 'Что делает правило body { background: pink; }?',
          options: ['Делает текст розовым', 'Делает фон страницы розовым', 'Ничего'],
          answer: 1,
        },
        {
          id: 'w2-q2',
          kind: 'single',
          prompt: 'Чем заканчивается каждое свойство в CSS?',
          options: ['Точкой', 'Точкой с запятой', 'Запятой'],
          answer: 1,
        },
        {
          id: 'w2-q3',
          kind: 'single',
          prompt: 'Какое свойство меняет размер шрифта?',
          options: ['font-size', 'text-size', 'size'],
          answer: 0,
        },
      ],
    },
    {
      id: 'web-3',
      title: 'Ссылки, картинки и кнопка',
      minutes: 15,
      sections: [
        {
          title: 'Ссылки и картинки',
          text: 'Ссылку делают тегом <a> с атрибутом href, в нём адрес. Картинку вставляют тегом <img> с атрибутом src. У <img> нет закрывающего тега.',
          code: '<a href="https://scratch.mit.edu">Scratch</a>\n<img src="cat.png" alt="Мой кот">',
          tip: 'Атрибут alt описывает картинку словами: его прочитают, если картинка не загрузится.',
        },
        {
          title: 'Кнопка с JavaScript',
          text: 'JavaScript оживляет страницу. Атрибут onclick у кнопки говорит, что сделать при нажатии. Команда alert показывает окошко с сообщением.',
          code: '<button onclick="alert(\'Привет!\')">Нажми меня</button>',
        },
      ],
      practice: [
        {
          id: 'w3-p1',
          kind: 'text',
          prompt: 'Какой атрибут тега <a> хранит адрес ссылки?',
          answer: ['href'],
        },
        {
          id: 'w3-p2',
          kind: 'text',
          prompt: 'Какой атрибут тега <img> указывает, какую картинку показать?',
          answer: ['src'],
        },
      ],
      quiz: [
        {
          id: 'w3-q1',
          kind: 'single',
          prompt: 'Какой тег делает ссылку?',
          options: ['<link>', '<a>', '<href>'],
          answer: 1,
        },
        {
          id: 'w3-q2',
          kind: 'single',
          prompt: 'Что покажет кнопка с onclick="alert(\'Ура\')" при нажатии?',
          options: ['Окошко с текстом «Ура»', 'Новую страницу', 'Ничего'],
          answer: 0,
        },
        {
          id: 'w3-q3',
          kind: 'multi',
          prompt: 'Из чего состоит почти любой сайт? Выбери все.',
          options: ['HTML', 'CSS', 'JavaScript', 'Scratch'],
          answer: [0, 1, 2],
        },
      ],
    },
  ],
  faq: [
    { q: 'Где писать код сайта?', a: 'В любом текстовом редакторе: подойдёт бесплатный Visual Studio Code или онлайн-редактор codepen.io, где результат видно сразу.' },
    { q: 'Как показать сайт друзьям?', a: 'Бесплатно опубликовать страничку можно на GitHub Pages или Netlify. С этим поможет наставник.' },
    { q: 'Нужен ли английский?', a: 'Теги и свойства это английские слова, но их немного и они быстро запоминаются. Знать язык заранее не обязательно.' },
  ],
};
