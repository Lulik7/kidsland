import type { Course } from './types';

const FAQ_BASE = [
  { q: 'Какой компьютер нужен для Unity?', a: 'Ноутбук или компьютер с Windows или macOS, от 8 ГБ оперативной памяти. Unity Personal бесплатна для обучения.' },
  { q: 'Нужно ли знать программирование заранее?', a: 'Для начального курса нет. Для среднего и продвинутого поможет опыт Python или Scratch.' },
];

export const unityCourse: Course = {
  id: 'unity',
  subject: 'unity',
  level: 'beginner',
  title: 'Unity: первая сцена',
  tagline: 'Объекты, компоненты и физика без кода',
  description:
    'Unity это движок, на котором сделаны тысячи игр для компьютеров, телефонов и консолей. Разберёмся с окнами редактора, соберём сцену из объектов и заставим её жить по законам физики.',
  ageMin: 10,
  ageMax: 14,
  color: '#3d3d5c',
  lessons: [
    {
      id: 'unity-1',
      title: 'Редактор Unity',
      minutes: 15,
      sections: [
        {
          title: 'Что такое игровой движок',
          text: 'Игровой движок берёт на себя сложную работу: рисует 3D-графику, считает физику, проигрывает звук, обрабатывает нажатия кнопок. Разработчику остаётся придумать игру и описать правила. Unity один из самых популярных движков: на нём сделаны Hollow Knight, Among Us и Cuphead.',
        },
        {
          title: 'Главные окна',
          text: 'Scene это рабочая сцена, где расставляют объекты. Game показывает, как игру увидит игрок через камеру. Hierarchy перечисляет все объекты сцены. Inspector показывает настройки выбранного объекта. Project хранит все файлы проекта: модели, звуки, скрипты.',
        },
        {
          title: 'GameObject и компоненты',
          text: 'Всё на сцене это GameObject: куб, свет, камера, персонаж. Сам по себе он пустой, а умения ему дают компоненты. Transform хранит положение, поворот и размер, он есть у каждого объекта. Mesh Renderer рисует объект, Collider делает его твёрдым, скрипт задаёт поведение.',
          tip: 'Объект это коробка, а компоненты это вещи, которые ты в неё кладёшь.',
        },
      ],
      practice: [
        {
          id: 'un1-p1',
          kind: 'single',
          prompt: 'В каком окне меняют положение и размер выбранного объекта?',
          options: ['Inspector', 'Project', 'Console'],
          answer: 0,
        },
        {
          id: 'un1-p2',
          kind: 'text',
          prompt: 'Какой компонент есть у каждого GameObject и хранит его положение?',
          answer: ['transform'],
        },
      ],
      quiz: [
        {
          id: 'un1-q1',
          kind: 'single',
          prompt: 'Что показывает окно Game?',
          options: ['Игру глазами камеры', 'Список файлов', 'Ошибки в коде'],
          answer: 0,
        },
        {
          id: 'un1-q2',
          kind: 'single',
          prompt: 'Что даёт объекту умения?',
          options: ['Компоненты', 'Имя объекта', 'Цвет фона'],
          answer: 0,
        },
        {
          id: 'un1-q3',
          kind: 'single',
          prompt: 'Где перечислены все объекты сцены?',
          options: ['Hierarchy', 'Inspector', 'Game'],
          answer: 0,
        },
      ],
    },
    {
      id: 'unity-2',
      title: 'Физика без кода',
      minutes: 15,
      sections: [
        {
          title: 'Rigidbody',
          text: 'Компонент Rigidbody включает для объекта физику: гравитацию, скорость, удары. Добавь кубу Rigidbody, нажми Play, и куб упадёт вниз. Параметр Mass задаёт массу, а галочка Use Gravity включает притяжение.',
        },
        {
          title: 'Collider',
          text: 'Collider описывает форму объекта для столкновений: Box Collider для коробок, Sphere Collider для шаров, Mesh Collider для сложных моделей. Если у пола нет коллайдера, куб пролетит сквозь него.',
        },
        {
          title: 'Физические материалы',
          text: 'Physic Material задаёт, насколько объект скользкий (Friction) и упругий (Bounciness). Сделай Bounciness равным 1, и мяч будет прыгать почти вечно. Так без единой строчки кода собирают простую игру с шарами и кеглями.',
          tip: 'Кнопка Play запускает игру, а изменения во время Play после остановки сбрасываются.',
        },
      ],
      practice: [
        {
          id: 'un2-p1',
          kind: 'single',
          prompt: 'Куб пролетает сквозь пол. Чего не хватает полу?',
          options: ['Collider', 'Rigidbody', 'Камеры'],
          answer: 0,
        },
        {
          id: 'un2-p2',
          kind: 'order',
          prompt: 'Расставь шаги, чтобы сделать прыгающий мяч.',
          items: ['Создать Sphere', 'Добавить Rigidbody', 'Создать Physic Material с Bounciness 1', 'Назначить материал коллайдеру мяча', 'Нажать Play'],
        },
      ],
      quiz: [
        {
          id: 'un2-q1',
          kind: 'single',
          prompt: 'Какой компонент включает гравитацию для объекта?',
          options: ['Rigidbody', 'Transform', 'Light'],
          answer: 0,
        },
        {
          id: 'un2-q2',
          kind: 'single',
          prompt: 'За что отвечает Bounciness?',
          options: ['За упругость, отскок', 'За цвет', 'За скорость камеры'],
          answer: 0,
        },
        {
          id: 'un2-q3',
          kind: 'single',
          prompt: 'Что будет с изменениями, сделанными во время Play?',
          options: ['Сбросятся после остановки', 'Сохранятся навсегда', 'Удалят проект'],
          answer: 0,
        },
      ],
    },
  ],
  faq: [...FAQ_BASE, { q: 'Что дальше?', a: 'Курс «C# для Unity» среднего уровня.' }],
};

export const unityMidCourse: Course = {
  id: 'unity-mid',
  subject: 'unity',
  level: 'intermediate',
  title: 'C# для Unity',
  tagline: 'Первые скрипты и управление персонажем',
  description:
    'Учимся писать скрипты на C#: разбираем, как устроен скрипт Unity, что такое Start и Update, и делаем персонажа, которым можно управлять с клавиатуры.',
  ageMin: 11,
  ageMax: 15,
  color: '#3d3d5c',
  lessons: [
    {
      id: 'unity-mid-1',
      title: 'Первый скрипт на C#',
      minutes: 18,
      sections: [
        {
          title: 'Как выглядит скрипт',
          text: 'Скрипт в Unity это класс на языке C#, который наследуется от MonoBehaviour. Его прикрепляют к объекту как компонент. Имя файла должно совпадать с именем класса.',
          code: 'using UnityEngine;\n\npublic class Hello : MonoBehaviour\n{\n    void Start()\n    {\n        Debug.Log("Привет, Unity!");\n    }\n}',
        },
        {
          title: 'Start и Update',
          text: 'Start выполняется один раз, когда объект появляется в игре. Update выполняется каждый кадр, то есть 30–60 раз в секунду и чаще. В Start обычно что-то настраивают, а в Update проверяют кнопки и двигают объекты.',
        },
        {
          title: 'Переменные и типы',
          text: 'В C# у каждой переменной есть тип: int для целых чисел, float для дробных (с буквой f: 2.5f), string для текста, bool для true/false. Слово public показывает переменную в окне Inspector, и её можно менять без правки кода.',
          code: 'public float speed = 5f;\npublic int lives = 3;\nstring heroName = "Робо";',
          tip: 'Каждая команда в C# заканчивается точкой с запятой.',
        },
      ],
      practice: [
        {
          id: 'unm1-p1',
          kind: 'single',
          prompt: 'Какой метод выполняется каждый кадр?',
          options: ['Update', 'Start', 'Main'],
          answer: 0,
        },
        {
          id: 'unm1-p2',
          kind: 'text',
          prompt: 'Какой тип выбрать для переменной со значением 3.5f?',
          answer: ['float'],
        },
      ],
      quiz: [
        {
          id: 'unm1-q1',
          kind: 'single',
          prompt: 'Что делает Debug.Log("Hi")?',
          options: ['Выводит Hi в окно Console', 'Показывает Hi на экране игры', 'Удаляет объект Hi'],
          answer: 0,
        },
        {
          id: 'unm1-q2',
          kind: 'single',
          prompt: 'Зачем писать public перед переменной?',
          options: ['Чтобы менять её в Inspector', 'Чтобы она стала быстрее', 'Так обязательно для всех переменных'],
          answer: 0,
        },
        {
          id: 'unm1-q3',
          kind: 'single',
          prompt: 'Чем заканчивается команда в C#?',
          options: ['Точкой с запятой', 'Двоеточием', 'Ничем'],
          answer: 0,
        },
      ],
    },
    {
      id: 'unity-mid-2',
      title: 'Управление персонажем',
      minutes: 18,
      sections: [
        {
          title: 'Читаем кнопки',
          text: 'Input.GetAxis("Horizontal") возвращает число от −1 до 1: −1 при нажатии стрелки влево или A, 1 при нажатии вправо или D, 0 если ничего не нажато. Так же работает "Vertical" для стрелок вверх и вниз.',
        },
        {
          title: 'Двигаем объект',
          text: 'transform.Translate сдвигает объект на заданный вектор. Vector3 это три числа: x (вправо), y (вверх), z (вперёд).',
          code: 'public float speed = 5f;\n\nvoid Update()\n{\n    float x = Input.GetAxis("Horizontal");\n    float z = Input.GetAxis("Vertical");\n    transform.Translate(new Vector3(x, 0, z) * speed * Time.deltaTime);\n}',
        },
        {
          title: 'Зачем Time.deltaTime',
          text: 'На быстром компьютере кадров больше, чем на медленном. Если двигать объект на одно и то же расстояние каждый кадр, на мощном ПК герой побежит быстрее. Time.deltaTime это время прошлого кадра в секундах: умножая на него, получаем скорость «в единицах в секунду» на любом компьютере.',
          tip: 'Для прыжка используют Input.GetKeyDown(KeyCode.Space): он срабатывает один раз в момент нажатия.',
        },
      ],
      practice: [
        {
          id: 'unm2-p1',
          kind: 'text',
          prompt: 'Что вернёт Input.GetAxis("Horizontal"), когда нажата стрелка вправо?',
          answer: ['1'],
        },
        {
          id: 'unm2-p2',
          kind: 'order',
          prompt: 'Собери метод Update для движения влево-вправо.',
          items: ['void Update()', '{', '    float x = Input.GetAxis("Horizontal");', '    transform.Translate(new Vector3(x, 0, 0) * speed * Time.deltaTime);', '}'],
        },
      ],
      quiz: [
        {
          id: 'unm2-q1',
          kind: 'single',
          prompt: 'Зачем умножать движение на Time.deltaTime?',
          options: ['Чтобы скорость не зависела от мощности компьютера', 'Чтобы объект стал больше', 'Чтобы игра закончилась'],
          answer: 0,
        },
        {
          id: 'unm2-q2',
          kind: 'single',
          prompt: 'Какая ось в Unity направлена вверх?',
          options: ['y', 'x', 'z'],
          answer: 0,
        },
        {
          id: 'unm2-q3',
          kind: 'single',
          prompt: 'Какой метод сработает один раз в момент нажатия пробела?',
          options: ['Input.GetKeyDown(KeyCode.Space)', 'Input.GetAxis("Space")', 'Debug.Log("Space")'],
          answer: 0,
        },
      ],
    },
  ],
  faq: [...FAQ_BASE, { q: 'Где писать код?', a: 'Unity открывает скрипты в Visual Studio или Visual Studio Code: они подсказывают названия команд и подсвечивают ошибки.' }],
};

export const unityProCourse: Course = {
  id: 'unity-pro',
  subject: 'unity',
  level: 'advanced',
  title: 'Unity: игровая логика',
  tagline: 'Столкновения, префабы и счёт',
  description:
    'Для тех, кто уже пишет скрипты. Научимся ловить столкновения, собирать предметы, создавать объекты из префабов и выводить счёт на экран. В конце получится мини-игра «собери монеты».',
  ageMin: 12,
  ageMax: 16,
  color: '#3d3d5c',
  lessons: [
    {
      id: 'unity-pro-1',
      title: 'Столкновения и триггеры',
      minutes: 18,
      sections: [
        {
          title: 'OnCollisionEnter',
          text: 'Когда два объекта с коллайдерами сталкиваются (и хотя бы у одного есть Rigidbody), Unity вызывает метод OnCollisionEnter. В него передаётся информация о том, с кем произошло столкновение.',
          code: 'void OnCollisionEnter(Collision other)\n{\n    Debug.Log("Врезались в " + other.gameObject.name);\n}',
        },
        {
          title: 'Триггеры',
          text: 'Если у коллайдера включить Is Trigger, объекты будут проходить сквозь него, но Unity сообщит о касании через OnTriggerEnter. Так делают монеты, финиш, зоны урона.',
        },
        {
          title: 'Теги и Destroy',
          text: 'Тег это метка объекта: «Player», «Coin», «Enemy». CompareTag проверяет метку, а Destroy удаляет объект со сцены.',
          code: 'void OnTriggerEnter(Collider other)\n{\n    if (other.CompareTag("Player"))\n    {\n        Destroy(gameObject);\n    }\n}',
          tip: 'gameObject с маленькой буквы означает объект, к которому прикреплён этот скрипт.',
        },
      ],
      practice: [
        {
          id: 'unp1-p1',
          kind: 'single',
          prompt: 'Монета должна исчезать, но игрок не должен в неё врезаться. Что включить у её коллайдера?',
          options: ['Is Trigger', 'Use Gravity', 'Is Kinematic'],
          answer: 0,
        },
        {
          id: 'unp1-p2',
          kind: 'text',
          prompt: 'Какой метод удаляет объект со сцены?',
          answer: ['destroy'],
        },
      ],
      quiz: [
        {
          id: 'unp1-q1',
          kind: 'single',
          prompt: 'Какой метод вызывается при входе в триггер?',
          options: ['OnTriggerEnter', 'OnCollisionEnter', 'Start'],
          answer: 0,
        },
        {
          id: 'unp1-q2',
          kind: 'single',
          prompt: 'Что проверяет other.CompareTag("Enemy")?',
          options: ['Есть ли у объекта тег Enemy', 'Жив ли враг', 'Сколько врагов на сцене'],
          answer: 0,
        },
        {
          id: 'unp1-q3',
          kind: 'single',
          prompt: 'Что нужно, чтобы сработал OnCollisionEnter?',
          options: ['Коллайдеры у обоих и Rigidbody хотя бы у одного', 'Только камера', 'Тег Player у обоих'],
          answer: 0,
        },
      ],
    },
    {
      id: 'unity-pro-2',
      title: 'Префабы и счёт',
      minutes: 18,
      sections: [
        {
          title: 'Префаб',
          text: 'Префаб это заготовка объекта со всеми компонентами. Перетащи готовую монету из Hierarchy в окно Project, и получится префаб. Поменяешь префаб, и изменятся все монеты на сцене сразу.',
        },
        {
          title: 'Instantiate',
          text: 'Instantiate создаёт копию префаба во время игры. Так появляются пули, враги и монеты в случайных местах.',
          code: 'public GameObject coinPrefab;\n\nvoid Start()\n{\n    for (int i = 0; i < 10; i++)\n    {\n        Vector3 pos = new Vector3(Random.Range(-8f, 8f), 0.5f, Random.Range(-8f, 8f));\n        Instantiate(coinPrefab, pos, Quaternion.identity);\n    }\n}',
        },
        {
          title: 'Счёт на экране',
          text: 'Для текста на экране создают Canvas и объект Text (TextMeshPro). Скрипт хранит счёт в переменной и обновляет текст, когда игрок собирает монету.',
          code: 'public TMP_Text scoreText;\nint score = 0;\n\npublic void AddPoint()\n{\n    score++;\n    scoreText.text = "Монеты: " + score;\n}',
          tip: 'score++ это короткая запись score = score + 1.',
        },
      ],
      practice: [
        {
          id: 'unp2-p1',
          kind: 'text',
          prompt: 'Сколько монет создаст цикл for (int i = 0; i < 10; i++)?',
          answer: ['10', 'десять'],
        },
        {
          id: 'unp2-p2',
          kind: 'order',
          prompt: 'Расставь шаги создания игры «собери монеты».',
          items: ['Сделать монету и превратить её в префаб', 'Создать монеты через Instantiate', 'Ловить касание игрока в OnTriggerEnter', 'Увеличить счёт и удалить монету'],
        },
      ],
      quiz: [
        {
          id: 'unp2-q1',
          kind: 'single',
          prompt: 'Что такое префаб?',
          options: ['Заготовка объекта, из которой делают копии', 'Камера', 'Ошибка в коде'],
          answer: 0,
        },
        {
          id: 'unp2-q2',
          kind: 'single',
          prompt: 'Чему равен score после трёх вызовов score++, если сначала он был 0?',
          options: ['3', '1', '0'],
          answer: 0,
        },
        {
          id: 'unp2-q3',
          kind: 'single',
          prompt: 'Что делает Instantiate?',
          options: ['Создаёт копию объекта во время игры', 'Удаляет объект', 'Перезапускает игру'],
          answer: 0,
        },
      ],
    },
  ],
  faq: [
    ...FAQ_BASE,
    { q: 'Как выложить игру?', a: 'Unity собирает игру для браузера (WebGL), и её можно бесплатно опубликовать на itch.io. Делайте это вместе с родителями.' },
  ],
};
