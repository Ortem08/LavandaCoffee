import asyncio
import hashlib
import json
import os
import random
import string
import qrcode
import cv2
import numpy as np
import ydb.iam
from PIL import Image
from io import BytesIO
from telegram import LabeledPrice, Bot, Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    PreCheckoutQueryHandler,
    filters,
)

TOKEN = os.getenv("TOKEN")
YDB_DATABASE = os.getenv("YDB_DATABASE")
YDB_ENDPOINT = os.getenv("YDB_ENDPOINT")

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': 'Location'
}

bot = Bot(TOKEN)

driver = ydb.Driver(
        endpoint=YDB_ENDPOINT,
        database=YDB_DATABASE,
        credentials=ydb.iam.ServiceAccountCredentials.from_file(
            key_file='authorized_key.json')
    )
driver.async_wait(fail_fast=True)
pool = ydb.QuerySessionPool(driver)


with open('menu_list_map.json', 'r', encoding='utf-8') as file:
    menu_data = json.load(file)


def get_item_by_id(item_id):
    for item in menu_data['menu_items']:
        if item['id'] == item_id:
            return item

    return None


def calculate_price(base_price, options):
    total_price = base_price
    for option_key, option_values in options.items():
        option_info = menu_data['options'].get(option_key, {})
        variants = option_info.get('variants', [])
        if option_info.get('multichoice', False):
            for value in option_values:
                for variant in variants:
                    if variant['value'] == value:
                        total_price += variant['price_increase']
        else:
            for variant in variants:
                if variant['value'] in option_values:
                    total_price += variant['price_increase']
                    break

    return total_price


def generate_keys():
    public_key = random.choice(string.ascii_uppercase) + ''.join(random.choices(string.digits, k=3))
    private_key = hashlib.sha256(os.urandom(32)).hexdigest()
    return public_key, private_key


def save_keys(public_key, private_key):
    params = {'$public_key': public_key, '$private_key': private_key,
              '$status': 'pending'}
    query = """
        DECLARE $public_key AS Utf8;
        DECLARE $private_key AS Utf8;
        DECLARE $status AS Utf8;

        INSERT INTO keys (public_key, private_key, created_at, status)
        VALUES ($public_key, $private_key, CurrentUtcDatetime(), $status)
    """

    pool.execute_with_retries(query=query, parameters=params)


def cleanup_expired_keys():
    query = """
        DELETE FROM keys
        WHERE status LIKE 'received';
    """

    pool.execute_with_retries(query=query)


def save_data(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=4)


def generate_qr_code(data):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    return qr.make_image(fill_color="black", back_color="white")


class OrderItem:
    def __init__(self, amount, id, options, price):
        self.amount = amount
        self.id = id
        self.options = options
        self.price = price

    def to_dict(self):
        return {
            'amount': self.amount,
            'id': self.id,
            'options': self.options,
            'price': self.price
        }

    @classmethod
    def from_dict(cls, data):
        return cls(
            amount=data['amount'],
            id=data['id'],
            options=data['options'],
            price=data.get('price')
        )

    def __str__(self):
        return f'amount: {str(self.amount)} ' \
               f'| id: {str(self.id)} ' \
               f'| options: {str(self.options)} ' \
               f'| price: {str(self.price)}'


def order_items_to_dict(order_items):
    return [item.to_dict() for item in order_items]


async def webhook_handler(request_body):
    user_tag = request_body['telegram-tag']
    #mutable_dict = MultiDict(request_body['order-data'])
    order_data = request_body['order-data']
    order_items_list = []

    item_amounts = order_data['item-amount']
    item_ids = order_data['itemID']
    item_options_list = order_data['itemOptions']

    for amount, item_id, item_options in zip(item_amounts, item_ids, item_options_list):
        item_id = int(item_id)
        amount = int(amount)
        options = json.loads(item_options)

        # Проверка наличия товара в меню
        menu_item = get_item_by_id(item_id)
        if not menu_item:
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': f'Item with ID {item_id} not found'})
            }

        # Проверка корректности опций
        for option_key in options.keys():
            if option_key not in menu_item['available_options']:
                return {
                    'statusCode': 400,
                    'headers': HEADERS,
                    'body': json.dumps({'error': f'Invalid option {option_key} for item with ID {item_id}'})
                }

        # Расчет цены
        base_price = menu_item['base_price']
        total_price = calculate_price(base_price, options) * amount

        # Создание объекта OrderItem и заполнение поля price
        order_item = OrderItem(amount=amount, id=item_id, options=options, price=-1)
        order_item.price = total_price
        order_items_list.append(order_item)

    params = {'$user_tag': user_tag}
    query = """
        DECLARE $user_tag AS Utf8;

        SELECT * FROM users
        WHERE user_tag LIKE $user_tag
        LIMIT 1;
    """
    result = pool.execute_with_retries(query=query, parameters=params)

    if len(result[0].rows):
        await send_invoice(result[0].rows[0]['chat_id'], order_items_list)
        return {
            'statusCode': 301,
            'headers': HEADERS | {
                'Location': 'https://lavandacoffee.website.yandexcloud.net/cart_page/cart.html?unregistered=false'
            },
            'body': json.dumps({'message': 'Redirecting...'})
        }

    return {
        'statusCode': 301,
        'headers': HEADERS | {
            'Location': 'https://lavandacoffee.website.yandexcloud.net/cart_page/cart.html?unregistered=true'
        },
        'body': json.dumps({'message': 'Redirecting...'})
    }


async def send_invoice(chat_id, order_items):
    cleanup_expired_keys()

    query = """
        SELECT COUNT(*) FROM orders;
    """
    storage_count = pool.execute_with_retries(query=query)[0].rows[0]['column0']

    order_id = int(storage_count) + 1
    title = f'Заказ {order_id}'
    description = '\n'.join([f'{item.amount}x {get_item_by_id(item.id)["name"]} - {item.price} RUB' for item in order_items])

    params = {'$order_id': order_id, '$order_data': json.dumps(order_items_to_dict(order_items))}
    query = """
        DECLARE $order_id AS Int64;
        DECLARE $order_data AS Utf8;

        INSERT INTO orders(order_id, order_data)
        VALUES ($order_id, CAST($order_data AS Json));
    """
    pool.execute_with_retries(query=query, parameters=params)

    provider_token = '381764678:TEST:85681'
    start_parameter = 'start'
    currency = 'RUB'
    prices = [LabeledPrice(label=f'{item.amount}x {get_item_by_id(item.id)["name"]}', amount=item.price * 100) for item in order_items]

    await bot.send_invoice(
        chat_id=chat_id,
        title=title,
        description=description,
        payload=str(order_id),
        provider_token=provider_token,
        start_parameter=start_parameter,
        prices=prices,
        currency=currency)


async def handle_pre_checkout(update, context):
    checkout_query = update.pre_checkout_query
    order_id = int(checkout_query.invoice_payload)

    params = {'$order_id': order_id}
    query = """
        DECLARE $order_id AS Int64;

        SELECT * FROM orders
        WHERE order_id = $order_id;
    """
    result = pool.execute_with_retries(query=query, parameters=params)

    if len(result[0].rows) == 0:
        raise ValueError("'Order ID' not found in order storage")

    order_items = result[0].rows[0]['order_data']

    valid_payload = []
    order_sum = 0

    for item in order_items:
        menu_item = get_item_by_id(item['id'])
        if not menu_item:
            await checkout_query.answer(ok=False, error_message=f"Item with ID {item['id']} not found.")
            return

        for option_key in item['options'].keys():
            if option_key not in menu_item['available_options']:
                await checkout_query.answer(ok=False, error_message=f"Invalid option {option_key} for item with ID {item['id']}.")
                return

        base_price = menu_item['base_price']
        position_price = calculate_price(base_price, item['options']) * item['amount']
        order_sum += position_price
        valid_payload.append(item)

    # Проверка суммы заказа
    if order_sum != checkout_query.total_amount / 100:
        await checkout_query.answer(ok=False, error_message="Incorrect total amount.")
        return

    await checkout_query.answer(ok=True)


async def handle_successful_payment(update, context):
    public_key, private_key = generate_keys()
    save_keys(public_key, private_key)

    with BytesIO() as buffer:
        qr_code_img = generate_qr_code(private_key)
        qr_code_img.save(buffer)

        chat_id = update.message.chat_id
        await context.bot.send_message(chat_id, f'Ваш код: {public_key}')
        await context.bot.send_photo(chat_id, photo=buffer.getvalue())

    await mark_order_ready(public_key, chat_id)


async def mark_order_ready(public_key, chat_id):
    await asyncio.sleep(random.randint(10, 20))

    params = {'$public_key': public_key}
    query = """
        DECLARE $public_key AS Utf8;

        SELECT * FROM keys
        WHERE public_key LIKE $public_key;
    """

    result = pool.execute_with_retries(query=query, parameters=params)
    if len(result[0].rows) > 0:
        query = """
            DECLARE $public_key AS Utf8;

            UPDATE keys
            SET status = 'ready'
            WHERE public_key LIKE $public_key;
        """
        pool.execute_with_retries(query=query, parameters=params)

        await bot.send_message(chat_id, f'Ваш заказ с кодом {public_key} готов!')


async def handle_qr_code(update, context):
    if not update.message.photo:
        await update.message.reply_text('Пожалуйста, отправьте QR-код.')
        return

    with BytesIO() as buffer:
        file_id = update.message.photo[-1].file_id
        new_file = await context.bot.get_file(file_id)
        await new_file.download_to_memory(buffer)

        img = Image.open(buffer)
        cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        detector = cv2.QRCodeDetector()
        data, _, _ = detector.detectAndDecode(cv_img)

    if not data:
        await update.message.reply_text('Не удалось прочитать QR-код.')
        return

    params = {'$private_key': data}
    query = """
        DECLARE $private_key AS Utf8;

        SELECT * FROM keys
        WHERE private_key LIKE $private_key;
    """
    result = pool.execute_with_retries(query=query, parameters=params)[0].rows

    if len(result) == 0:
        await update.message.reply_text('Неверный QR-код.')

    if result[0]['status'] == 'ready':
        query = """
            DECLARE $private_key AS Utf8;

            UPDATE keys
            SET status = 'received'
            WHERE private_key LIKE $private_key;
        """
        pool.execute_with_retries(query=query, parameters=params)

        await update.message.reply_text(f'Заказ с кодом {result[0]["public_key"]} получен!')
    else:
        await update.message.reply_text(f'Заказ с кодом {result[0]["public_key"]} не готов или уже получен.')
        return


async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.message.chat_id
    user_tag = '@' + update.message.from_user.username

    register_message = await write_to_db(chat_id, user_tag)
    await update.message.reply_text(register_message)


async def write_to_db(chat_id: int, user_tag: str) -> str:
    params = {"$chat_id": chat_id, "$user_tag": user_tag}
    find_query = """
        DECLARE $chat_id AS Int64;

        SELECT chat_id, user_tag FROM users
        WHERE chat_id = $chat_id;
    """

    result = pool.execute_with_retries(query=find_query, parameters=params)
    if len(result[0].rows) > 0:
        return "Вы уже зарегистрированы и можете оформить заказ"

    insert_query = """
        DECLARE $chat_id AS Int64;
        DECLARE $user_tag AS Utf8;

        INSERT INTO users(chat_id, user_tag)
        VALUES($chat_id, $user_tag);
    """
    pool.execute_with_retries(query=insert_query, parameters=params)

    return "Вы успешно зарегистрированы!"


async def main(event, context):
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': HEADERS
        }

    application = Application.builder().token(TOKEN).build()
    application.add_handler(CommandHandler("start", handle_start))
    application.add_handler(PreCheckoutQueryHandler(handle_pre_checkout))
    application.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, handle_successful_payment))
    application.add_handler(MessageHandler(filters.PHOTO, handle_qr_code))

    body = json.loads(event['body'])
    print(body)
    if 'update_id' not in body:
        return await webhook_handler(body)

    update = Update.de_json(body, application.bot)

    await application.initialize()
    await application.process_update(update)

    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps({'message': 'Successfully processed the update'})
    }
