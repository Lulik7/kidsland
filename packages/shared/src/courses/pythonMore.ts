import type { Course } from './types';

export const pythonMidCourse: Course = {
  id: 'python-mid',
  subject: 'python',
  level: 'intermediate',
  title: 'Python: списки и функции',
  tagline: 'Храним много данных и пишем свои команды',
  description:
    'Для тех, кто знает print, if и for. Научимся работать со списками и создавать собственные функции, чтобы программы стали короче и понятнее.',
  ageMin: 10,
  ageMax: 14,
  color: '#4c97ff',
  lessons: [
    {
      id: 'python-mid-1',
      title: 'Списки',
      minutes: 15,
      sections: [
        {
          title: 'Создаём список',
          text: 'Список пишут в квадратных скобках через запятую. Элемент достают по номеру (индексу), и нумерация начинается с нуля. len() возвращает длину списка.',
          code: 'pets = ["кот", "пёс", "хомяк"]\nprint(pets[0])    # кот\nprint(len(pets))  # 3',
        },
        {
          title: 'Изменяем и перебираем',
          text: 'append добавляет элемент в конец. Цикл for умеет проходить по списку напрямую, без range.',
          code: 'pets.append("попугай")\nfor pet in pets:\n    print("У меня есть", pet)',
          tip: 'pets[-1] это последний элемент списка.',
        },
      ],
      practice: [
        {
          id: 'pm1-p1',
          kind: 'text',
          prompt: 'Что выведет программа?',
          code: 'colors = ["red", "green", "blue"]\nprint(colors[1])',
          answer: ['green'],
        },
        {
          id: 'pm1-p2',
          kind: 'text',
          prompt: 'Что выведет программа?',
          code: 'nums = [4, 8]\nnums.append(15)\nprint(len(nums))',
          answer: ['3'],
        },
      ],
      quiz: [
        {
          id: 'pm1-q1',
          kind: 'single',
          prompt: 'Какой индекс у первого элемента списка?',
          options: ['0', '1', '-1'],
          answer: 0,
        },
        {
          id: 'pm1-q2',
          kind: 'single',
          prompt: 'Что делает append?',
          options: ['Удаляет элемент', 'Добавляет элемент в конец', 'Сортирует список'],
          answer: 1,
        },
        {
          id: 'pm1-q3',
          kind: 'single',
          prompt: 'Чему равна сумма?',
          code: 'total = 0\nfor n in [2, 5, 3]:\n    total = total + n',
          options: ['10', '7', '253'],
          answer: 0,
        },
      ],
    },
    {
      id: 'python-mid-2',
      title: 'Функции',
      minutes: 15,
      sections: [
        {
          title: 'def: своя команда',
          text: 'Функция это кусок кода с именем. Её объявляют словом def, а потом вызывают по имени со скобками сколько угодно раз.',
          code: 'def hello(name):\n    print("Привет,", name)\n\nhello("Маша")\nhello("Тимур")',
        },
        {
          title: 'return: функция возвращает ответ',
          text: 'return отдаёт результат обратно туда, откуда функцию вызвали. Его можно сохранить в переменную или сразу напечатать.',
          code: 'def square(x):\n    return x * x\n\nprint(square(5))   # 25',
          tip: 'После return функция заканчивается, строки ниже в ней не выполнятся.',
        },
      ],
      practice: [
        {
          id: 'pm2-p1',
          kind: 'text',
          prompt: 'Что выведет программа?',
          code: 'def double(n):\n    return n * 2\n\nprint(double(7))',
          answer: ['14'],
        },
        {
          id: 'pm2-p2',
          kind: 'order',
          prompt: 'Собери функцию, которая возвращает большее из двух чисел.',
          items: ['def bigger(a, b):', '    if a > b:', '        return a', '    return b'],
        },
      ],
      quiz: [
        {
          id: 'pm2-q1',
          kind: 'single',
          prompt: 'Каким словом объявляют функцию?',
          options: ['func', 'def', 'function'],
          answer: 1,
        },
        {
          id: 'pm2-q2',
          kind: 'single',
          prompt: 'Что делает return?',
          options: ['Возвращает результат из функции', 'Повторяет функцию', 'Печатает на экран'],
          answer: 0,
        },
        {
          id: 'pm2-q3',
          kind: 'single',
          prompt: 'Что выведет программа?',
          code: 'def add(a, b):\n    return a + b\n\nprint(add(2, add(3, 4)))',
          options: ['9', '24', '7'],
          answer: 0,
        },
      ],
    },
  ],
  faq: [
    { q: 'Почему индекс начинается с нуля?', a: 'Так исторически сложилось в большинстве языков: индекс показывает, на сколько шагов отойти от начала списка. Первый элемент в нуле шагов.' },
    { q: 'Чем print отличается от return?', a: 'print показывает значение человеку на экране, а return отдаёт значение программе, чтобы с ним можно было дальше считать.' },
    { q: 'Что дальше?', a: 'Курс «Python: словари и черепашка» продвинутого уровня.' },
  ],
};

export const pythonProCourse: Course = {
  id: 'python-pro',
  subject: 'python',
  level: 'advanced',
  title: 'Python: словари и черепашка',
  tagline: 'Данные с подписями и рисование кодом',
  description:
    'Для уверенных питонистов. Разберём словари, цикл while со случайными числами и нарисуем узоры модулем turtle.',
  ageMin: 11,
  ageMax: 15,
  color: '#4c97ff',
  lessons: [
    {
      id: 'python-pro-1',
      title: 'Словари и while',
      minutes: 15,
      sections: [
        {
          title: 'Словарь: ключ и значение',
          text: 'Словарь хранит пары «ключ: значение» в фигурных скобках. Значение достают по ключу, как слово в настоящем словаре.',
          code: 'hero = {"name": "Робо", "hp": 100}\nprint(hero["name"])   # Робо\nhero["hp"] = hero["hp"] - 30',
        },
        {
          title: 'Цикл while и случайности',
          text: 'while повторяет код, пока условие верно. Модуль random даёт случайные числа: так делают игры «угадай число».',
          code: 'import random\nsecret = random.randint(1, 10)\nguess = 0\nwhile guess != secret:\n    guess = int(input("Число? "))\nprint("Угадал!")',
          tip: 'Если условие while никогда не станет ложным, программа зациклится навсегда.',
        },
      ],
      practice: [
        {
          id: 'pp1-p1',
          kind: 'text',
          prompt: 'Что выведет программа?',
          code: 'ages = {"Аня": 9, "Боря": 11}\nprint(ages["Боря"])',
          answer: ['11'],
        },
        {
          id: 'pp1-p2',
          kind: 'text',
          prompt: 'Сколько раз выполнится тело цикла?',
          code: 'n = 1\nwhile n < 20:\n    n = n * 2',
          answer: ['5', 'пять'],
          explain: 'n становится 2, 4, 8, 16, 32: пять шагов.',
        },
      ],
      quiz: [
        {
          id: 'pp1-q1',
          kind: 'single',
          prompt: 'Как достать значение из словаря d по ключу "x"?',
          options: ['d.x', 'd["x"]', 'd(x)'],
          answer: 1,
        },
        {
          id: 'pp1-q2',
          kind: 'single',
          prompt: 'Когда остановится цикл while?',
          options: ['Когда условие станет ложным', 'Через 10 повторов', 'Никогда'],
          answer: 0,
        },
        {
          id: 'pp1-q3',
          kind: 'single',
          prompt: 'Какие числа может вернуть random.randint(1, 3)?',
          options: ['1 и 2', '1, 2 и 3', '0, 1, 2 и 3'],
          answer: 1,
        },
      ],
    },
    {
      id: 'python-pro-2',
      title: 'Черепашья графика',
      minutes: 15,
      sections: [
        {
          title: 'Черепашка рисует',
          text: 'Модуль turtle даёт черепашку с карандашом. forward двигает её вперёд, left и right поворачивают на угол в градусах.',
          code: 'import turtle\nt = turtle.Turtle()\nfor i in range(4):\n    t.forward(100)\n    t.left(90)',
        },
        {
          title: 'Узоры из циклов',
          text: 'Если повторить фигуру много раз с небольшим поворотом, получится красивый узор. Цвет меняют командой t.color("red").',
          code: 'for i in range(36):\n    t.circle(60)\n    t.left(10)',
          tip: 'Сумма всех поворотов для замкнутой фигуры равна 360 градусам.',
        },
      ],
      practice: [
        {
          id: 'pp2-p1',
          kind: 'text',
          prompt: 'На сколько градусов поворачивать в t.left(…), чтобы нарисовать правильный пятиугольник?',
          answer: ['72'],
          explain: '360 / 5 = 72.',
        },
        {
          id: 'pp2-p2',
          kind: 'order',
          prompt: 'Собери программу, которая рисует треугольник.',
          items: ['import turtle', 't = turtle.Turtle()', 'for i in range(3):', '    t.forward(100)', '    t.left(120)'],
        },
      ],
      quiz: [
        {
          id: 'pp2-q1',
          kind: 'single',
          prompt: 'Что делает t.forward(50)?',
          options: ['Поворачивает на 50 градусов', 'Двигает вперёд на 50 шагов', 'Рисует круг радиусом 50'],
          answer: 1,
        },
        {
          id: 'pp2-q2',
          kind: 'single',
          prompt: 'Какую фигуру нарисует цикл range(6) с forward(80) и left(60)?',
          options: ['Шестиугольник', 'Квадрат', 'Звезду'],
          answer: 0,
        },
        {
          id: 'pp2-q3',
          kind: 'single',
          prompt: 'Чему равна сумма поворотов замкнутой выпуклой фигуры?',
          options: ['180', '360', '90'],
          answer: 1,
        },
      ],
    },
  ],
  faq: [
    { q: 'Где запустить turtle?', a: 'На компьютере с установленным Python и редактором Thonny, или онлайн на trinket.io: там черепашка рисует прямо в браузере.' },
    { q: 'Что делать, если программа зациклилась?', a: 'Нажми Ctrl+C или кнопку «Стоп» в редакторе, затем проверь, меняется ли переменная в условии while.' },
    { q: 'Что после этого курса?', a: 'Pygame Zero для игр или первые проекты с данными. Наставник подберёт задачу под интересы.' },
  ],
};
