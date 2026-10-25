import { lessonsFromText } from '../dsl';
import type { Lesson } from '../types';

/** Roblox, beginner: lessons 4–20. */
const beginner = lessonsFromText('roblox', 4, `
# Окна Roblox Studio
Explorer :: Окно Explorer показывает всё, что есть в игре: Workspace (мир), Players (игроки), Lighting (свет), ServerScriptService (скрипты).
Properties :: Окно Properties показывает свойства выбранного объекта: цвет, размер, положение, прозрачность.
Toolbox :: В Toolbox лежат готовые модели. Бери только проверенные модели: в чужих иногда прячутся вредные скрипты.
! Если окно пропало, верни его через вкладку View.
? Где видно всё, что есть в игре? | Explorer | Toolbox | Output
? Где меняют цвет детали? | Properties | Explorer | Chat

# Детали и инструменты
Part :: Деталь (Part) это кирпичик мира. Бывают блок, шар, цилиндр и клин.
Инструменты :: Select выбирает, Move двигает, Scale меняет размер, Rotate поворачивает.
Привязка :: Шаг перемещения (Snap) делает так, что детали встают ровно, без щелей.
Попробуй :: Построй домик из 6 деталей: пол, 4 стены и крышу.
? Какой инструмент меняет размер? | Scale | Move | Rotate
? Зачем нужен шаг перемещения? | Чтобы детали вставали ровно | Для звука | Для цвета

# Anchored и физика
Падение :: В Roblox работает гравитация: деталь без опоры упадёт.
Anchored :: Галочка Anchored закрепляет деталь в воздухе. Платформы и стены почти всегда закреплены.
CanCollide :: Если выключить CanCollide, сквозь деталь можно пройти, как сквозь призрака.
? Что делает Anchored? | Закрепляет деталь на месте | Красит деталь | Удаляет деталь
? Как сделать стену-призрак? | Выключить CanCollide | Включить Anchored | Сделать красной

# Материалы и цвета
Материал :: Свойство Material делает деталь похожей на дерево, камень, траву, лёд или металл.
Цвет :: BrickColor и Color задают цвет. Яркие цвета помогают игроку заметить важное.
Прозрачность :: Transparency от 0 до 1: 0 обычная деталь, 1 невидимая.
Попробуй :: Сделай ледяной мост: материал Ice, голубой цвет, прозрачность 0.3.
? Что значит Transparency = 1? | Деталь невидима | Деталь красная | Деталь тяжёлая
? Какой материал скользкий? | Ice | Wood | Brick

# Местность (Terrain)
Редактор :: Terrain Editor рисует горы, воду, песок и траву большими кистями.
Инструменты :: Add добавляет землю, Subtract копает, Smooth сглаживает, Paint красит материалом.
Вода :: Вода в Terrain настоящая: в ней можно плавать.
? Какой инструмент копает яму? | Subtract | Add | Paint
? Можно ли плавать в воде Terrain? | Да | Нет | Только на телефоне

# Модели и группировка
Группа :: Выдели несколько деталей и нажми Ctrl+G, получится модель (Model). Её удобно двигать целиком.
Имена :: Давай понятные имена: «Дом», «Мост», «Финиш». Так легче писать скрипты.
Папки :: Folder хранит объекты без превращения в модель.
? Какая комбинация группирует детали? | Ctrl+G | Ctrl+Z | Ctrl+P
? Зачем давать понятные имена? | Легче найти и писать скрипты | Для скорости | Не нужно

# Точка появления
SpawnLocation :: Игрок появляется на детали SpawnLocation. Без неё он окажется в случайном месте.
Чекпоинты :: Несколько SpawnLocation с разными командами работают как контрольные точки в обби.
Проверка :: Нажми Play и убедись, что игрок появляется там, где задумано.
? Где появляется игрок? | На SpawnLocation | На крыше | В воде
? Что такое чекпоинт? | Точка, откуда продолжаешь после падения | Монетка | Враг

# Свойства из скрипта
Script :: Скрипт создают в детали или в ServerScriptService: правый клик, Insert Object, Script.
Меняем свойства :: Через точку обращаемся к свойствам детали.
> local part = script.Parent
> part.BrickColor = BrickColor.new("Bright red")
> part.Transparency = 0.5
Output :: Ошибки и сообщения print видны в окне Output.
? Что значит script.Parent? | Объект, в котором лежит скрипт | Игрок | Камера
? Где видно сообщения print? | Output | Toolbox | Terrain

# Переменные в Lua
local :: Переменную создают словом local.
> local coins = 0
> local name = "Хома"
> print(name .. " собрал " .. coins .. " монет")
Склейка :: Две точки .. склеивают строки.
Комментарии :: Две чёрточки -- начинают комментарий, Lua его не выполняет.
? Как склеить строки в Lua? | Двумя точками .. | Знаком + | Звёздочкой
? Как начинается комментарий в Lua? | -- | // | #

# Ожидание и циклы
wait :: task.wait(1) ждёт одну секунду.
Мигающая деталь :: Цикл while true повторяется бесконечно.
> local part = script.Parent
> while true do
>   part.Transparency = 1
>   task.wait(1)
>   part.Transparency = 0
>   task.wait(1)
> end
! В бесконечном цикле обязательно должно быть ожидание, иначе игра зависнет.
Попробуй :: Сделай платформу, которая каждые 2 секунды исчезает и появляется. Пройди по ней вовремя!
? Что делает task.wait(2)? | Ждёт 2 секунды | Повторяет 2 раза | Удаляет деталь
? Что нужно в бесконечном цикле? | Ожидание | Ничего | Два цикла

# Цикл for
Счёт :: Цикл for считает от одного числа до другого.
> for i = 1, 10 do
>   print("Шаг " .. i)
> end
Лестница :: С помощью for можно построить лестницу из деталей.
> for i = 1, 10 do
>   local step = Instance.new("Part")
>   step.Size = Vector3.new(4, 1, 2)
>   step.Position = Vector3.new(0, i, i * 2)
>   step.Anchored = true
>   step.Parent = workspace
> end
Попробуй :: Поменяй числа в Vector3, чтобы лестница шла вбок или по кругу. Сделай 20 ступенек.
? Сколько раз выполнится for i = 1, 5? | 5 | 4 | 1
? Что делает Instance.new("Part")? | Создаёт новую деталь | Удаляет деталь | Красит деталь

# Касание: событие Touched
Событие :: Touched срабатывает, когда что-то касается детали.
> local part = script.Parent
> part.Touched:Connect(function(hit)
>   part.BrickColor = BrickColor.random()
> end)
Кто коснулся :: hit это деталь, которая коснулась. Обычно это нога игрока.
Попробуй :: Сделай лаву: при касании Humanoid.Health = 0. Потом пол, который меняет цвет под ногами.
? Когда срабатывает Touched? | Когда что-то касается детали | Каждую секунду | При запуске
? Что делает BrickColor.random()? | Случайный цвет | Красный цвет | Ничего

# Обби: полоса препятствий
Что такое обби :: Обби это игра, где надо пройти полосу препятствий: прыжки, узкие мостики, движущиеся платформы.
Сложность :: Начинай с лёгких прыжков и постепенно усложняй.
Попробуй :: Построй обби из 10 платформ и 2 чекпоинтов.
? Как строить сложность в обби? | От лёгкого к сложному | Сразу сложно | Без правил
? Что помогает не начинать сначала? | Чекпоинты | Лава | Музыка

# Звуки
Sound :: Объект Sound вставляют в деталь, в SoundId пишут номер звука из библиотеки.
Запуск :: Звук включают из скрипта.
> local sound = script.Parent.Sound
> script.Parent.Touched:Connect(function()
>   sound:Play()
> end)
Громкость :: Volume задаёт громкость, Looped повторяет звук по кругу.
? Как включить звук из скрипта? | sound:Play() | sound.Start | play(sound)
? Что делает Looped? | Повторяет звук по кругу | Выключает звук | Делает тише

# Свет и время суток
Lighting :: В Lighting меняют время суток (ClockTime), яркость и туман.
Ночь :: ClockTime = 0 это полночь, 12 полдень.
> game.Lighting.ClockTime = 20
Лампы :: PointLight в детали светится как лампочка.
? Что значит ClockTime = 12? | Полдень | Полночь | Утро
? Что светит как лампочка? | PointLight | Sound | Script

# Безопасность в Roblox
Личная информация :: Никогда не пиши в чате своё имя и фамилию, адрес, школу, телефон.
Пароль :: Пароль от аккаунта знаешь только ты и родители. Сайты «бесплатных робуксов» крадут аккаунты.
Взрослые :: Если кто-то в игре пугает или просит секретов, расскажи родителям и нажми «Пожаловаться».
? Что делать, если обещают бесплатные робуксы за пароль? | Не давать пароль и сказать взрослым | Дать пароль | Дать адрес
? Можно ли писать в чате свой адрес? | Нет | Да | Только другу из игры

# Итоговый проект: моё обби
Задание :: Сделай обби из 15 препятствий: мигающие платформы, лава, лестница из for, звук на финише.
План :: Нарисуй карту на бумаге, построй, добавь скрипты, проверь сам и дай пройти другу.
Проверка :: Всё ли закреплено Anchored? Есть ли чекпоинты? Нет ли ошибок в Output?
? Что сделать перед публикацией? | Проверить игру | Ничего | Удалить скрипты
? Где искать ошибки скриптов? | В Output | В Toolbox | В Terrain
`);

/** Roblox, middle: lessons 4–20. */
const mid = lessonsFromText('roblox-mid', 4, `
# Игрок и персонаж
Player и Character :: Player это аккаунт игрока, Character это его фигурка в мире. В Character есть Humanoid.
Получаем игрока по касанию :: По детали узнаём, кто коснулся.
> part.Touched:Connect(function(hit)
>   local player = game.Players:GetPlayerFromCharacter(hit.Parent)
>   if player then
>     print(player.Name .. " коснулся!")
>   end
> end)
Попробуй :: Сделай табличку, которая при касании пишет в Output имя игрока.
? Где находится Humanoid? | В Character | В Lighting | В Toolbox
? Что вернёт GetPlayerFromCharacter для камня? | nil | Игрока | Ошибку

# Humanoid: здоровье и скорость
Свойства :: Humanoid.Health это здоровье, WalkSpeed скорость ходьбы (обычно 16), JumpPower сила прыжка.
Ускоритель :: Деталь, которая разгоняет игрока.
> part.Touched:Connect(function(hit)
>   local hum = hit.Parent:FindFirstChild("Humanoid")
>   if hum then hum.WalkSpeed = 40 end
> end)
Попробуй :: Сделай батут: при касании JumpPower = 100, а через 3 секунды снова 50.
? Какая обычная скорость ходьбы? | 16 | 100 | 1
? Что делает FindFirstChild? | Ищет объект по имени | Удаляет объект | Создаёт объект

# Лидерборд: leaderstats
Таблица очков :: Если у игрока есть папка leaderstats, Roblox покажет таблицу справа сверху.
> game.Players.PlayerAdded:Connect(function(player)
>   local stats = Instance.new("Folder")
>   stats.Name = "leaderstats"
>   stats.Parent = player
>   local coins = Instance.new("IntValue")
>   coins.Name = "Монеты"
>   coins.Parent = stats
> end)
Когда :: PlayerAdded срабатывает, когда игрок заходит.
Попробуй :: Добавь второе значение «Уровень» в leaderstats и задай ему стартовое значение 1.
? Как должна называться папка? | leaderstats | stats | score
? Когда срабатывает PlayerAdded? | Когда игрок заходит | Когда выходит | Каждую секунду

# Монетки
Сбор :: Монетка добавляет очко и исчезает.
> coin.Touched:Connect(function(hit)
>   local player = game.Players:GetPlayerFromCharacter(hit.Parent)
>   if player then
>     player.leaderstats["Монеты"].Value += 1
>     coin:Destroy()
>   end
> end)
Много монет :: Положи монеты в папку и подключи событие к каждой в цикле.
Попробуй :: Разложи 10 монеток по обби. Сделай, чтобы монетка крутилась с помощью цикла.
? Что делает Destroy()? | Удаляет объект | Копирует | Красит
? Где хранится число монет? | В Value | В Name | В Color

# Таблицы в Lua
Список :: Таблица хранит несколько значений.
> local colors = {"Red", "Blue", "Green"}
> print(colors[1])  -- Red
> print(#colors)    -- 3
Перебор :: ipairs перебирает список по порядку.
> for i, c in ipairs(colors) do print(i, c) end
! В Lua счёт идёт с 1, а не с 0.
Попробуй :: Сделай таблицу из 5 цветов и в цикле по очереди крась деталь каждым цветом через секунду.
? Что выведет colors[1]? | Red | Blue | Ошибку
? Что значит #colors? | Длина таблицы | Цвет | Сумма

# Функции
Своя функция :: Функция это кусок кода с именем.
> local function heal(hum, amount)
>   hum.Health = math.min(hum.Health + amount, hum.MaxHealth)
> end
Возврат :: return отдаёт результат.
> local function double(x) return x * 2 end
> print(double(5))  -- 10
Попробуй :: Напиши функцию giveCoins(player, n) и вызови её из двух разных монеток.
? Что делает return? | Возвращает результат | Останавливает игру | Печатает
? Что делает math.min(5, 3)? | Даёт 3 | Даёт 5 | Даёт 8

# Движущиеся платформы: TweenService
Плавное движение :: TweenService плавно меняет свойства.
> local TweenService = game:GetService("TweenService")
> local info = TweenInfo.new(3, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
> local goal = {Position = part.Position + Vector3.new(0, 0, 20)}
> TweenService:Create(part, info, goal):Play()
Параметры :: 3 секунды, -1 значит бесконечно, true значит ехать обратно.
Попробуй :: Сделай лифт, который плавно едет вверх на 30 и обратно, и вращающуюся платформу.
? Что делает TweenService? | Плавно меняет свойства | Удаляет | Включает звук
? Что значит -1 в TweenInfo? | Повторять бесконечно | Один раз | Ошибка

# Телепорт
Перенос :: Персонажа переносят, меняя его CFrame.
> pad.Touched:Connect(function(hit)
>   local root = hit.Parent:FindFirstChild("HumanoidRootPart")
>   if root then root.CFrame = target.CFrame + Vector3.new(0, 3, 0) end
> end)
Зачем +3 :: Чтобы игрок появился над платформой, а не внутри неё.
Попробуй :: Сделай две пары телепортов разного цвета: синий ведёт к синему, красный к красному.
? Что такое HumanoidRootPart? | Главная деталь персонажа | Рука | Камера
? Зачем поднимать на 3? | Чтобы не застрять в детали | Для красоты | Не нужно

# ClickDetector: кнопки по клику
Клик мышкой :: ClickDetector в детали ловит клики.
> part.ClickDetector.MouseClick:Connect(function(player)
>   print(player.Name .. " нажал кнопку")
>   door.Transparency = 1
>   door.CanCollide = false
> end)
Дистанция :: MaxActivationDistance задаёт, с какого расстояния можно кликнуть.
Попробуй :: Сделай кнопку, которая открывает дверь на 5 секунд, а потом закрывает её.
? Что ловит ClickDetector? | Клики мышкой | Касания | Звуки
? Что передаёт MouseClick? | Игрока | Деталь | Число

# Интерфейс: ScreenGui
GUI :: ScreenGui в StarterGui показывается на экране игрока. Внутри TextLabel (текст), TextButton (кнопка), Frame (рамка).
Размер :: UDim2 задаёт размер в долях экрана и пикселях: UDim2.new(0.3, 0, 0.1, 0).
LocalScript :: Интерфейс управляется LocalScript, он работает у каждого игрока отдельно.
? Где создают ScreenGui? | В StarterGui | В Workspace | В Lighting
? Какой скрипт управляет интерфейсом? | LocalScript | Script | ModuleScript

# Кнопка на экране
Нажатие :: TextButton.Activated срабатывает при нажатии.
> local button = script.Parent
> local count = 0
> button.Activated:Connect(function()
>   count += 1
>   button.Text = "Нажато: " .. count
> end)
Стиль :: Скругли углы объектом UICorner, добавь рамку UIStroke.
Попробуй :: Сделай кнопку «Скорость», которая включает и выключает быстрый бег.
? Какое событие у кнопки? | Activated | Touched | PlayerAdded
? Что скругляет углы? | UICorner | UDim2 | Frame

# Клиент и сервер
Два мира :: Script работает на сервере для всех, LocalScript на компьютере игрока.
Почему важно :: Если LocalScript покрасит деталь, увидит только этот игрок.
Безопасность :: Очки и награды всегда считай на сервере, иначе их легко подделать.
? Где считать очки? | На сервере | В LocalScript | Не важно
? Кто увидит изменение из LocalScript? | Только этот игрок | Все | Никто

# RemoteEvent
Мост :: RemoteEvent передаёт сообщение от клиента серверу.
> -- LocalScript
> game.ReplicatedStorage.Buy:FireServer("меч")
> -- Script
> game.ReplicatedStorage.Buy.OnServerEvent:Connect(function(player, item)
>   print(player.Name .. " хочет купить " .. item)
> end)
Проверка :: Сервер проверяет, хватает ли денег, а не верит клиенту на слово.
Попробуй :: Сделай кнопку на экране, которая просит сервер поменять цвет неба для всех игроков.
? Где лежит RemoteEvent? | В ReplicatedStorage | В Lighting | В Terrain
? Что первым приходит в OnServerEvent? | Игрок | Предмет | Ничего

# Магазин
Покупка :: Сервер проверяет монеты, списывает их и выдаёт предмет.
> Buy.OnServerEvent:Connect(function(player, item)
>   local coins = player.leaderstats["Монеты"]
>   if coins.Value >= 10 then
>     coins.Value -= 10
>     game.ServerStorage.Sword:Clone().Parent = player.Backpack
>   end
> end)
Clone :: Clone копирует предмет из хранилища.
Попробуй :: Добавь в магазин второй товар: зелье скорости за 5 монет.
? Где хранить предметы для магазина? | ServerStorage | Workspace | StarterGui
? Что делает Clone()? | Копирует | Удаляет | Прячет

# Инструменты (Tool)
Tool :: Предмет в руках игрока. Внутри деталь Handle, за неё персонаж держит.
Активация :: Activated срабатывает, когда игрок кликает с инструментом.
> tool.Activated:Connect(function()
>   tool.Handle.BrickColor = BrickColor.random()
> end)
StarterPack :: Положи Tool в StarterPack, и его получит каждый игрок.
? Как называется деталь, за которую держат? | Handle | Grip | Root
? Куда положить, чтобы получил каждый? | StarterPack | Lighting | Terrain

# Отладка
print :: Ставь print в разных местах, чтобы понять, до куда дошёл код.
Ошибки :: Красная строка в Output показывает файл и номер строки ошибки.
nil :: Частая ошибка «attempt to index nil»: объект не найден. Используй WaitForChild.
? Что значит «attempt to index nil»? | Объект не найден | Всё хорошо | Нет звука
? Что ждёт появления объекта? | WaitForChild | FindFirstChild | Destroy

# Итоговый проект: игра с магазином
Задание :: Мир с монетками, лидерборд, кнопка магазина на экране, RemoteEvent и покупка инструмента.
Порядок :: Сначала leaderstats, потом монеты, потом GUI, потом RemoteEvent и сервер.
Тест :: Проверь игру в режиме Test с двумя игроками (Start, 2 Players).
? Где проверять деньги при покупке? | На сервере | На клиенте | Нигде
? Как проверить с двумя игроками? | Test с 2 Players | Попросить маму | Нельзя
`);

/** Roblox, pro: lessons 3–20. */
const pro = lessonsFromText('roblox-pro', 3, `
# Сохранение: DataStore
Память между заходами :: DataStoreService сохраняет данные игрока на серверах Roblox.
> local DSS = game:GetService("DataStoreService")
> local store = DSS:GetDataStore("Coins")
> game.Players.PlayerRemoving:Connect(function(player)
>   store:SetAsync(player.UserId, player.leaderstats["Монеты"].Value)
> end)
Включить :: В Game Settings, Security включи доступ к API Services в Studio.
Осторожно :: У DataStore есть ограничения: не сохраняй каждую секунду, а только при выходе и иногда по таймеру.
? Что сохраняет DataStore? | Данные между заходами | Цвет неба | Звуки
? Какой ключ лучше? | UserId | Имя | Случайное число

# Загрузка данных и pcall
Загрузка :: При входе читаем сохранённое значение.
> local ok, value = pcall(function()
>   return store:GetAsync(player.UserId)
> end)
> if ok then coins.Value = value or 0 end
pcall :: pcall ловит ошибку, чтобы скрипт не упал, если сервер Roblox не ответил.
Попробуй :: Зайди в игру, собери монеты, выйди и зайди снова. Монеты должны сохраниться.
? Зачем pcall? | Чтобы ошибка не сломала скрипт | Для скорости | Для звука
? Что значит value or 0? | Если пусто, взять 0 | Умножить | Ошибка

# ModuleScript
Общий код :: ModuleScript хранит функции, которые нужны многим скриптам.
> local M = {}
> function M.addCoins(player, n)
>   player.leaderstats["Монеты"].Value += n
> end
> return M
Подключение :: local Coins = require(game.ServerScriptService.Coins)
Попробуй :: Вынеси в модуль цены магазина и функцию покупки, подключи её из двух скриптов.
? Чем подключают модуль? | require | import | include
? Что должен вернуть модуль? | Таблицу | Ничего | Деталь

# Таблицы-словари
Ключи :: Таблица может хранить пары «ключ = значение».
> local prices = {sword = 10, shield = 15, potion = 3}
> print(prices.sword)  -- 10
> for name, price in pairs(prices) do print(name, price) end
pairs :: pairs перебирает все пары, но без определённого порядка.
Попробуй :: Храни инвентарь игрока как словарь: предмет = количество. Выведи весь инвентарь.
? Что выведет prices.potion? | 3 | 10 | potion
? Что перебирает словарь? | pairs | ipairs | while

# Враги: простой NPC
NPC :: Неигровой персонаж это модель с Humanoid.
Преследование :: Humanoid:MoveTo идёт к точке.
> while true do
>   local target = findNearestPlayer()
>   if target then npc.Humanoid:MoveTo(target.Position) end
>   task.wait(0.5)
> end
Урон :: При касании врага уменьшай Health игрока.
? Чем NPC идёт к точке? | Humanoid:MoveTo | Teleport | Tween
? Зачем ждать 0.5 в цикле? | Чтобы не нагружать игру | Для красоты | Не нужно

# Поиск пути: PathfindingService
Обход стен :: PathfindingService строит маршрут вокруг препятствий.
> local path = game:GetService("PathfindingService"):CreatePath()
> path:ComputeAsync(npc.HumanoidRootPart.Position, goal)
> for _, wp in ipairs(path:GetWaypoints()) do
>   npc.Humanoid:MoveTo(wp.Position)
>   npc.Humanoid.MoveToFinished:Wait()
> end
Точки :: Waypoints это точки маршрута, по которым идёт NPC.
Попробуй :: Построй лабиринт и пусти NPC от входа к выходу.
? Что строит PathfindingService? | Маршрут в обход препятствий | Дом | Музыку
? Что такое waypoint? | Точка маршрута | Монета | Звук

# Анимации
Animation :: Анимацию создают в Animation Editor и публикуют, получая номер.
Запуск :: Animator загружает и проигрывает анимацию.
> local anim = Instance.new("Animation")
> anim.AnimationId = "rbxassetid://000000"
> local track = humanoid.Animator:LoadAnimation(anim)
> track:Play()
Танец :: Сделай кнопку, которая запускает танец персонажа.
? Что проигрывает анимацию? | Animator | Sound | Tween
? Что нужно для анимации? | AnimationId | SoundId | Color

# Раунды и таймер
Цикл игры :: Многие игры идут раундами: лобби, игра, итог.
> while true do
>   status.Value = "Ждём игроков"
>   task.wait(10)
>   for t = 60, 1, -1 do
>     status.Value = "Осталось " .. t
>     task.wait(1)
>   end
>   status.Value = "Раунд окончен!"
>   task.wait(5)
> end
StringValue :: Статус храни в StringValue в ReplicatedStorage, чтобы GUI его показывал.
Попробуй :: Покажи статус раунда в TextLabel на экране всех игроков.
? Что значит for t = 60, 1, -1? | Обратный отсчёт от 60 | Счёт до 60 | Ошибка
? Где хранить статус для всех? | ReplicatedStorage | ServerStorage | Lighting

# Команды (Teams)
Teams :: Сервис Teams делит игроков на команды с цветами.
Распределение :: player.Team = game.Teams.Red
Спавн команды :: SpawnLocation с TeamColor пускает только свою команду.
? Как дать игроку команду? | player.Team = ... | player.Color = ... | Никак
? Чем спавн выбирает команду? | TeamColor | Size | Name

# Частицы и эффекты
ParticleEmitter :: Создаёт огонь, искры, дым, конфетти.
Настройки :: Rate (сколько в секунду), Lifetime (сколько живут), Speed, Color.
> emitter:Emit(50)  -- взрыв конфетти один раз
Beam и Trail :: Beam это луч между точками, Trail это след за объектом.
? Что делает ParticleEmitter? | Частицы: огонь, искры | Звук | Текст
? Что оставляет след за объектом? | Trail | Beam | Sound

# Камера
CurrentCamera :: В LocalScript камера доступна как workspace.CurrentCamera.
Заставка :: Режим Scriptable позволяет поставить камеру куда угодно.
> local cam = workspace.CurrentCamera
> cam.CameraType = Enum.CameraType.Scriptable
> cam.CFrame = CFrame.new(Vector3.new(0, 50, 50), Vector3.new(0, 0, 0))
Вернуть :: Custom возвращает обычную камеру.
? Где управляют камерой? | В LocalScript | В Script | В Lighting
? Какой режим камеры даёт полный контроль? | Scriptable | Custom | Follow

# Ввод: клавиши
UserInputService :: Ловит нажатия клавиш на клиенте.
> local UIS = game:GetService("UserInputService")
> UIS.InputBegan:Connect(function(input, busy)
>   if busy then return end
>   if input.KeyCode == Enum.KeyCode.E then print("Нажата E") end
> end)
busy :: Если игрок печатает в чате, busy = true, и клавишу не надо обрабатывать.
Попробуй :: Сделай рывок: по клавише Shift игрок на секунду бежит быстрее, потом перезарядка 3 секунды.
? Что значит busy? | Игрок занят, например, чатом | Клавиша сломана | Ошибка
? Как проверить клавишу E? | Enum.KeyCode.E | "E" | KeyE

# Мобильные игроки
Сенсор :: Половина игроков в Roblox на телефонах. Кнопки должны быть крупными.
ContextActionService :: Создаёт кнопку на экране телефона для действия.
Проверка :: В Studio есть эмулятор устройств: проверь игру как на телефоне.
? Какие кнопки нужны на телефоне? | Крупные | Мелкие | Никакие
? Где проверить игру как на телефоне? | Эмулятор устройств | Нигде | В Output

# Оптимизация
Меньше деталей :: Тысячи мелких деталей тормозят. Объединяй их или используй меши.
StreamingEnabled :: Загружает мир частями вокруг игрока.
Скрипты :: Не делай циклы без ожидания, отключай события, которые больше не нужны.
? Что тормозит игру? | Тысячи мелких деталей | Один блок | Свет
? Что делает StreamingEnabled? | Загружает мир частями | Удаляет мир | Красит

# Монетизация и честность
Game Pass :: Платное преимущество навсегда, например, двойные монеты.
Честно :: Игра должна быть интересной и без покупок. Не обманывай игроков.
Для детей :: Покупки делают только с разрешения родителей.
? Что важно в честной игре? | Интересно и без покупок | Всё платно | Обман
? Кто разрешает покупки ребёнку? | Родители | Друг | Никто

# Тестирование с друзьями
Плейтест :: Пригласи друзей и молча смотри, как они играют. Где застревают, там надо исправить.
Отзывы :: Спроси: что понравилось, что было непонятно, что добавить.
Версии :: Сохраняй версии (File, Version History), чтобы вернуться, если что-то сломалось.
? Что делать во время плейтеста? | Смотреть и записывать | Подсказывать всё | Уйти
? Как вернуть старую версию? | Version History | Ctrl+G | Никак

# Бейджи и достижения
Badge :: Бейдж это награда, которая навсегда остаётся в профиле игрока.
> local BadgeService = game:GetService("BadgeService")
> BadgeService:AwardBadge(player.UserId, 0000000)
Когда давать :: За первое прохождение, за секретную комнату, за 100 монет.
Попробуй :: Придумай 5 достижений для своей игры: одно лёгкое, три средних и одно секретное.
? Где хранится бейдж? | В профиле игрока навсегда | В Workspace | В Output
? Чем выдают бейдж? | BadgeService:AwardBadge | Instance.new | Destroy

# Итоговый проект: игра с раундами
Задание :: Арена с раундами и таймером, команды, враги с поиском пути, сохранение монет, эффекты победы.
Порядок :: Раунды, команды, враги, DataStore, GUI, эффекты, плейтест, публикация.
Описание :: Напиши понятное описание и сделай яркую иконку игры.
? С чего начать большой проект? | С плана и главного цикла | С иконки | С музыки
? Что сделать перед публикацией? | Плейтест | Ничего | Удалить врагов
`);

export const ROBLOX_LEVELS: Record<string, Lesson[]> = { roblox: beginner, 'roblox-mid': mid, 'roblox-pro': pro };
