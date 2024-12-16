# LavandaCoffee

## Подготовка

Создайте telegram бота и сохраните его токен в переменную окружения
BOT_TOKEN:
```bash
export BOT_TOKEN=<VALUE>
```


Сохраните ваш `folder id` в переменную окружения:
   ```bash
   export FOLDER_ID=<VALUE>
   ```


## Развертывание
Для того, чтобы развернуть приложение с использованием 
serverless-технологий, потребуется выполнить следующие шаги.
1. Создать бакет object storage, например с именем _lavandacoffee_: 
    ```bash
    yc storage bucket create --name lavandacoffee --max-size 104857600 --public-read
   ```

2. Загрузить в него файл `LavandaCoffeeWeb/redirect.html`.
   <br></br>

3. Настроить бакет как вебсайт
   ```bash
   yc storage bucket update --name lavandacoffee --website-settings '{"index": "redirect.html"}' --cors allowed-methods='[method-get,method-post]',allowed-headers='*',allowed-origins='*',expose-headers='[X-Amz-Request-Id,Location]',max-age-seconds=3000
   ```
   
4. Создать YDB:
   ```bash
   yc ydb database create --serverless --name lavandacoffee-db --sls-storage-size 2GB
   ```   

   Нужно сохранить эндпоинт и бд:
   ```bash
   export YDB_ENDPOINT=<VALUE>
   export YDB_DATABASE=<VALUE>
   ```
   Например, `endpoint = grpcs://ydb.serverless.yandexcloud.net:2135`

   `database = /ru-central1/b1g0nbtusphe5n0v4qoc/etnqsnmib4fic0cfk73r`
   <br></br>

5. Выполнить скрипт `init_db.sh`:
   ```bash
   ./init_db.sh
   ```
   Он создаст serverless ydb, сервисный аккаунт к ней, ключ доступа, а также 3 таблицы.
   <br></br>

6. Создать облачную функцию:
   ```bash
   yc serverless function create lavandacoffee-bot-handler
   ```
   И сделать ее публичной:
   ```bash
   yc serverless function allow-unauthenticated-invoke lavandacoffee-bot-handler
   ```
   
   Запомнить `function id`.
   <br></br>

7. Собрать архив с именем `function.zip` в текущей папке:
   
   В архиве должны быть следующие файлы:
   * `ServerlessBot.py`
   * `LavandaCoffeeWeb/menu/menu_list_map.json`
   * `requirements.txt`
   * `authorized.key` полученный после выполнения шага 5
   <br></br>
   ```bash
   zip function.zip authorized.key requirements.txt LavandaCoffeeWeb/menu/menu_list_map.json ServerlessBot.py
   ```
8. Запустить скрипт `update_function.sh`:
   ```bash
   ./update_function.sh
   ```

9. Создать Api gateway:

   В файл `spec.yml` подставить значение `function id` и выполнить команду: 
   ```bash
   yc serverless api-gateway create --name lavandacoffee-api --spec=spec.yml
   ```
   
10. Изменить адрес в файле `SetWebhook.py` и запустить его, чтобы обновления отправлялись на адрес нашего gateway:
    ```bash
    python3 SetWebhook.py
    ```
   
11. Заменить адрес отправки формы в файле
`LavandaCoffeeWeb/cart_page/cart.html` на адрес gateway
<br></br>

12. Загрузить все оставшиеся файлы из папки `LavandaCoffeeWeb`


Поздравляю! Вы развернули LavandaCoffee.

В качестве тестовых платежных данных можно использовать Номер карты: `1111 1111 1111 1026`, Действительна до: `12/25`
Cvv: `000`