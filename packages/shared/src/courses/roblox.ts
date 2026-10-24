import type { Course } from './types';

const FAQ_BASE = [
  { q: 'Нужен ли мощный компьютер?', a: 'Roblox Studio работает на обычном ноутбуке с Windows или macOS. На планшете и телефоне можно играть, но создавать игры нельзя.' },
  { q: 'Это бесплатно?', a: 'Да, Roblox Studio бесплатная. Нужен аккаунт Roblox: его лучше создать вместе с родителями и включить родительский контроль.' },
];

export const robloxCourse: Course = {
  id: 'roblox',
  subject: 'roblox',
  level: 'beginner',
  title: 'Roblox Studio: мой первый мир',
  tagline: 'Строим уровень и пишем первый скрипт',
  description:
    'Roblox Studio это программа, в которой создают игры для Roblox. Разберёмся, как устроена студия, построим свой первый мир из деталей и оживим его коротким скриптом на языке Lua.',
  ageMin: 7,
  ageMax: 12,
  color: '#e2231a',
  lessons: [
    {
      id: 'roblox-1',
      title: 'Знакомство с Roblox Studio',
      minutes: 15,
      sections: [
        {
          title: 'Что такое Roblox Studio',
          text: 'Все игры в Roblox, от обби до симуляторов, сделаны в Roblox Studio. Это бесплатная программа для компьютера. В ней строят мир из деталей, добавляют персонажей и пишут скрипты, которые управляют игрой. Готовую игру можно опубликовать, и в неё смогут зайти друзья.',
        },
        {
          title: 'Главные окна',
          text: 'В центре находится 3D-вид, где строится мир. Справа окно Explorer (Проводник): в нём списком показано всё, что есть в игре. Под ним окно Properties (Свойства): здесь меняют цвет, размер, материал выбранного предмета. Toolbox (Набор инструментов) хранит готовые модели: деревья, машины, здания.',
          tip: 'Если окно пропало, верни его через вкладку View (Вид).',
        },
        {
          title: 'Детали (Part)',
          text: 'Мир в Roblox собирается из деталей. Деталь это блок, шар, цилиндр или клин. Кнопка Part на вкладке Home добавляет новую деталь. Инструменты Move, Scale и Rotate двигают, растягивают и поворачивают её. Свойство Anchored (Закреплено) не даёт детали падать: без него платформа упадёт, как только начнётся игра.',
        },
        {
          title: 'Проверяем игру',
          text: 'Кнопка Play запускает игру прямо в студии: появляется твой персонаж, и можно бегать по миру. Кнопка Stop возвращает в режим строительства. Проверяй игру часто: так ошибки находятся сразу.',
          tip: 'Сохраняй проект через File → Save to Roblox, чтобы он не потерялся.',
        },
      ],
      practice: [
        {
          id: 'rb1-p1',
          kind: 'single',
          prompt: 'Платформа упала вниз, как только ты нажал Play. Что нужно было включить?',
          options: ['Anchored', 'Transparency', 'CanCollide'],
          answer: 0,
          explain: 'Anchored закрепляет деталь на месте.',
        },
        {
          id: 'rb1-p2',
          kind: 'order',
          prompt: 'Расставь шаги создания платформы в правильном порядке.',
          items: ['Нажать кнопку Part', 'Растянуть деталь инструментом Scale', 'Включить Anchored в окне Properties', 'Нажать Play и проверить'],
        },
      ],
      quiz: [
        {
          id: 'rb1-q1',
          kind: 'single',
          prompt: 'В каком окне видно список всех предметов в игре?',
          options: ['Explorer', 'Toolbox', 'Output'],
          answer: 0,
        },
        {
          id: 'rb1-q2',
          kind: 'single',
          prompt: 'Где меняют цвет и материал детали?',
          options: ['В окне Properties', 'В окне Toolbox', 'В настройках компьютера'],
          answer: 0,
        },
        {
          id: 'rb1-q3',
          kind: 'single',
          prompt: 'Что делает кнопка Play?',
          options: ['Запускает игру прямо в студии', 'Удаляет все детали', 'Публикует игру для всех'],
          answer: 0,
        },
      ],
    },
    {
      id: 'roblox-2',
      title: 'Первый скрипт на Lua',
      minutes: 15,
      sections: [
        {
          title: 'Язык Lua',
          text: 'Скрипты в Roblox пишут на языке Lua (в Roblox его версия называется Luau). Это настоящий текстовый язык программирования, но очень простой. Чтобы добавить скрипт, наведи на деталь в окне Explorer, нажми плюсик и выбери Script.',
        },
        {
          title: 'print и окно Output',
          text: 'Команда print выводит сообщение в окно Output. Это удобно, чтобы проверить, что скрипт работает. Текст пишут в кавычках.',
          code: 'print("Привет из Roblox!")',
        },
        {
          title: 'script.Parent',
          text: 'Слово script означает сам скрипт, а script.Parent означает предмет, внутри которого скрипт лежит. Через точку можно обратиться к свойствам предмета и изменить их.',
          code: 'local part = script.Parent\npart.BrickColor = BrickColor.new("Bright red")\npart.Transparency = 0.5',
          tip: 'local создаёт переменную. Transparency 0 значит непрозрачная деталь, 1 значит невидимая.',
        },
        {
          title: 'Событие Touched',
          text: 'Событие Touched срабатывает, когда кто-то касается детали. К событию подключают функцию с помощью Connect. Так деталь может менять цвет, когда на неё наступает игрок.',
          code: 'local part = script.Parent\n\npart.Touched:Connect(function()\n    part.BrickColor = BrickColor.Random()\nend)',
        },
      ],
      practice: [
        {
          id: 'rb2-p1',
          kind: 'text',
          prompt: 'Какой командой вывести сообщение в окно Output?',
          answer: ['print'],
        },
        {
          id: 'rb2-p2',
          kind: 'order',
          prompt: 'Собери скрипт: при касании деталь становится невидимой.',
          items: ['local part = script.Parent', 'part.Touched:Connect(function()', '    part.Transparency = 1', 'end)'],
        },
      ],
      quiz: [
        {
          id: 'rb2-q1',
          kind: 'single',
          prompt: 'На каком языке пишут скрипты в Roblox?',
          options: ['Lua', 'Python', 'Scratch'],
          answer: 0,
        },
        {
          id: 'rb2-q2',
          kind: 'single',
          prompt: 'Что означает script.Parent?',
          options: ['Предмет, в котором лежит скрипт', 'Родителей игрока', 'Самый первый скрипт в игре'],
          answer: 0,
        },
        {
          id: 'rb2-q3',
          kind: 'single',
          prompt: 'Когда срабатывает событие Touched?',
          options: ['Когда кто-то касается детали', 'Каждую секунду', 'Когда игра закрывается'],
          answer: 0,
        },
      ],
    },
  ],
  faq: [...FAQ_BASE, { q: 'Что дальше?', a: 'Курс «Roblox: Lua и игровые механики» среднего уровня.' }],
};

export const robloxMidCourse: Course = {
  id: 'roblox-mid',
  subject: 'roblox',
  level: 'intermediate',
  title: 'Roblox: Lua и игровые механики',
  tagline: 'Переменные, условия и лава, которая обжигает',
  description:
    'Для тех, кто уже строил в Roblox Studio. Разберём переменные, условия и функции в Lua и сделаем настоящие механики: лаву, прыжковые платформы и двери.',
  ageMin: 9,
  ageMax: 14,
  color: '#e2231a',
  lessons: [
    {
      id: 'roblox-mid-1',
      title: 'Переменные, условия и функции',
      minutes: 15,
      sections: [
        {
          title: 'Переменные',
          text: 'Переменная хранит значение под именем. В Lua её создают словом local. Значения бывают числами, текстом (в кавычках) и логическими true или false.',
          code: 'local coins = 10\nlocal name = "Робо"\nlocal isAlive = true\ncoins = coins + 5\nprint(coins)   -- 15',
          tip: 'Две чёрточки -- начинают комментарий: компьютер его не читает.',
        },
        {
          title: 'Условия if',
          text: 'if проверяет условие, then начинает действия, end заканчивает. Для сравнения используют == (равно), ~= (не равно), > и <. Обрати внимание: «не равно» в Lua пишется ~=, а не != как в других языках.',
          code: 'if coins >= 20 then\n    print("Можно купить меч")\nelse\n    print("Копи дальше")\nend',
        },
        {
          title: 'Функции',
          text: 'Функция это кусок кода с именем. Её объявляют словом function и закрывают словом end. Функцию можно вызывать много раз, передавая разные значения.',
          code: 'local function greet(playerName)\n    print("Привет, " .. playerName)\nend\n\ngreet("Аня")',
          tip: 'Две точки .. в Lua склеивают строки.',
        },
      ],
      practice: [
        {
          id: 'rbm1-p1',
          kind: 'text',
          prompt: 'Что выведет код?',
          code: 'local x = 7\nx = x * 2\nprint(x)',
          answer: ['14'],
        },
        {
          id: 'rbm1-p2',
          kind: 'text',
          prompt: 'Как в Lua записать «не равно»?',
          answer: ['~='],
        },
      ],
      quiz: [
        {
          id: 'rbm1-q1',
          kind: 'single',
          prompt: 'Каким словом заканчивается блок if в Lua?',
          options: ['end', 'stop', 'fi'],
          answer: 0,
        },
        {
          id: 'rbm1-q2',
          kind: 'single',
          prompt: 'Что выведет print("Lv" .. 5)?',
          options: ['Lv5', 'Lv .. 5', 'Ошибку'],
          answer: 0,
        },
        {
          id: 'rbm1-q3',
          kind: 'single',
          prompt: 'Каким словом создают переменную в Lua?',
          options: ['local', 'var', 'let'],
          answer: 0,
        },
      ],
    },
    {
      id: 'roblox-mid-2',
      title: 'Лава и задержка (debounce)',
      minutes: 15,
      sections: [
        {
          title: 'Кто коснулся?',
          text: 'Событие Touched передаёт в функцию ту часть, которая коснулась детали, например ногу персонажа. Её родитель это сам персонаж. Чтобы понять, что это игрок, ищем внутри него Humanoid: это объект, который отвечает за здоровье и движение.',
          code: 'part.Touched:Connect(function(hit)\n    local humanoid = hit.Parent:FindFirstChild("Humanoid")\n    if humanoid then\n        humanoid.Health = 0\n    end\nend)',
        },
        {
          title: 'Лава-блок',
          text: 'Код выше и есть лава: если деталь коснулся игрок, его здоровье становится 0. Сделай деталь красной, материал Neon, и получится классическое препятствие из обби. Можно не убивать сразу, а отнимать здоровье: humanoid.Health = humanoid.Health - 20.',
        },
        {
          title: 'Debounce: защита от повторов',
          text: 'Touched срабатывает много раз подряд, пока игрок стоит на детали. Чтобы действие происходило один раз, используют переменную-флажок debounce: пока она true, новые касания игнорируются. task.wait(1) делает паузу на секунду.',
          code: 'local debounce = false\npart.Touched:Connect(function(hit)\n    if debounce then return end\n    debounce = true\n    print("Касание!")\n    task.wait(1)\n    debounce = false\nend)',
        },
      ],
      practice: [
        {
          id: 'rbm2-p1',
          kind: 'text',
          prompt: 'Какой объект внутри персонажа отвечает за его здоровье?',
          answer: ['humanoid'],
        },
        {
          id: 'rbm2-p2',
          kind: 'text',
          prompt: 'У игрока 100 здоровья. Он два раза коснулся детали, которая отнимает 20. Сколько здоровья осталось?',
          answer: ['60'],
        },
      ],
      quiz: [
        {
          id: 'rbm2-q1',
          kind: 'single',
          prompt: 'Зачем нужен debounce?',
          options: ['Чтобы действие не повторялось много раз подряд', 'Чтобы деталь стала красной', 'Чтобы игра быстрее загружалась'],
          answer: 0,
        },
        {
          id: 'rbm2-q2',
          kind: 'single',
          prompt: 'Что делает task.wait(1)?',
          options: ['Делает паузу на 1 секунду', 'Удаляет деталь', 'Повторяет код 1 раз'],
          answer: 0,
        },
        {
          id: 'rbm2-q3',
          kind: 'single',
          prompt: 'Что вернёт FindFirstChild("Humanoid"), если коснулся мяч, а не игрок?',
          options: ['nil, то есть ничего', 'Игрока', 'Число 0'],
          answer: 0,
        },
      ],
    },
  ],
  faq: [...FAQ_BASE, { q: 'Где смотреть ошибки скрипта?', a: 'В окне Output (вкладка View → Output). Красные строки показывают ошибку и номер строки, где она случилась.' }],
};

export const robloxProCourse: Course = {
  id: 'roblox-pro',
  subject: 'roblox',
  level: 'advanced',
  title: 'Roblox: свой обби с очками',
  tagline: 'Циклы, таблицы и таблица лидеров',
  description:
    'Для уверенных скриптеров. Научимся работать с циклами и таблицами в Lua и сделаем таблицу лидеров с очками, как в популярных играх Roblox.',
  ageMin: 10,
  ageMax: 15,
  color: '#e2231a',
  lessons: [
    {
      id: 'roblox-pro-1',
      title: 'Циклы и таблицы',
      minutes: 18,
      sections: [
        {
          title: 'Цикл for',
          text: 'for повторяет код заданное число раз. Переменная i по очереди принимает значения от первого числа до второго включительно. Это отличается от Python, где последнее число не входит.',
          code: 'for i = 1, 5 do\n    print("Шаг " .. i)\nend',
        },
        {
          title: 'Таблицы',
          text: 'Таблица в Lua хранит много значений, как список. Её пишут в фигурных скобках. Нумерация в Lua начинается с 1. Знак # перед именем возвращает длину таблицы.',
          code: 'local colors = {"Red", "Green", "Blue"}\nprint(colors[1])   -- Red\nprint(#colors)     -- 3',
        },
        {
          title: 'Перебираем таблицу',
          text: 'ipairs проходит по таблице по порядку и даёт номер и значение. Так можно, например, перекрасить все детали в папке: GetChildren возвращает таблицу всех детей объекта.',
          code: 'for i, part in ipairs(workspace.Obby:GetChildren()) do\n    part.Anchored = true\nend',
          tip: 'Так за одну секунду можно закрепить сотни деталей.',
        },
      ],
      practice: [
        {
          id: 'rbp1-p1',
          kind: 'text',
          prompt: 'Сколько раз выполнится тело цикла for i = 3, 7 do … end?',
          answer: ['5', 'пять'],
          explain: 'i будет 3, 4, 5, 6 и 7.',
        },
        {
          id: 'rbp1-p2',
          kind: 'text',
          prompt: 'Что выведет код?',
          code: 'local pets = {"Кот", "Пёс", "Хомяк"}\nprint(pets[2])',
          answer: ['пёс', 'пес'],
        },
      ],
      quiz: [
        {
          id: 'rbp1-q1',
          kind: 'single',
          prompt: 'С какого номера начинается нумерация таблиц в Lua?',
          options: ['С 1', 'С 0', 'С -1'],
          answer: 0,
        },
        {
          id: 'rbp1-q2',
          kind: 'single',
          prompt: 'Что вернёт #{"a", "b", "c", "d"}?',
          options: ['4', '3', '"d"'],
          answer: 0,
        },
        {
          id: 'rbp1-q3',
          kind: 'single',
          prompt: 'Что возвращает GetChildren()?',
          options: ['Таблицу всех вложенных объектов', 'Только первый объект', 'Количество игроков'],
          answer: 0,
        },
      ],
    },
    {
      id: 'roblox-pro-2',
      title: 'Таблица лидеров и очки',
      minutes: 18,
      sections: [
        {
          title: 'leaderstats',
          text: 'Чтобы справа вверху появилась таблица с очками, внутри каждого игрока создают папку с точным названием leaderstats. Всё, что лежит в ней (например, IntValue «Монеты»), Roblox показывает в таблице лидеров.',
          code: 'game.Players.PlayerAdded:Connect(function(player)\n    local stats = Instance.new("Folder")\n    stats.Name = "leaderstats"\n    stats.Parent = player\n\n    local coins = Instance.new("IntValue")\n    coins.Name = "Монеты"\n    coins.Parent = stats\nend)',
        },
        {
          title: 'Где писать такой скрипт',
          text: 'Скрипт с PlayerAdded кладут в ServerScriptService: это место для серверных скриптов, которые работают для всех игроков сразу. Событие PlayerAdded срабатывает каждый раз, когда в игру заходит новый игрок.',
        },
        {
          title: 'Начисляем монеты',
          text: 'Монетка на карте при касании находит игрока через GetPlayerFromCharacter и увеличивает его значение. После этого монету уничтожают методом Destroy.',
          code: 'coin.Touched:Connect(function(hit)\n    local player = game.Players:GetPlayerFromCharacter(hit.Parent)\n    if player then\n        player.leaderstats["Монеты"].Value += 1\n        coin:Destroy()\n    end\nend)',
          tip: 'Изменять очки нужно только на сервере, иначе игроки смогут их подделать.',
        },
      ],
      practice: [
        {
          id: 'rbp2-p1',
          kind: 'text',
          prompt: 'Как должна называться папка, чтобы Roblox показал очки в таблице лидеров?',
          answer: ['leaderstats'],
        },
        {
          id: 'rbp2-p2',
          kind: 'order',
          prompt: 'Расставь шаги создания таблицы лидеров.',
          items: ['Дождаться события PlayerAdded', 'Создать папку leaderstats внутри игрока', 'Создать IntValue «Монеты» в этой папке', 'Увеличивать Value, когда игрок берёт монету'],
        },
      ],
      quiz: [
        {
          id: 'rbp2-q1',
          kind: 'single',
          prompt: 'Где хранят серверные скрипты?',
          options: ['ServerScriptService', 'StarterGui', 'Lighting'],
          answer: 0,
        },
        {
          id: 'rbp2-q2',
          kind: 'single',
          prompt: 'Когда срабатывает PlayerAdded?',
          options: ['Когда в игру заходит игрок', 'Когда игрок прыгает', 'Раз в минуту'],
          answer: 0,
        },
        {
          id: 'rbp2-q3',
          kind: 'single',
          prompt: 'Почему очки меняют на сервере?',
          options: ['Чтобы игроки не могли их подделать', 'Так красивее', 'На клиенте нет чисел'],
          answer: 0,
        },
      ],
    },
  ],
  faq: [
    ...FAQ_BASE,
    { q: 'Можно ли заработать на своей игре?', a: 'В Roblox есть внутриигровая валюта и продажа предметов, но это делают только вместе с родителями и с учётом правил Roblox.' },
  ],
};
