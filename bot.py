from flask import Flask, request, redirect, jsonify
from telegram import LabeledPrice, Bot, Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    PreCheckoutQueryHandler,
    filters,
)
import asyncio
import json
import os
import logging
from werkzeug.datastructures import ImmutableMultiDict, MultiDict


logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
TOKEN = '7106122843:AAEFkPrGsz1ge_AREhqZb5s5wNdDbffgyLk'
bot = Bot(token=TOKEN)
application = Application.builder().token(TOKEN).build()

loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

script_dir = os.path.dirname(os.path.abspath(__file__))

user_data_file = os.path.join(script_dir, 'user_data.json')
order_data_file = os.path.join(script_dir, 'order_data.json')
menu_file = os.path.join(script_dir, 'menu/menu_list_map.json')


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


with open(menu_file, 'r', encoding='utf-8') as file:
    menu_data = json.load(file)


def load_data(file_path):
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return json.load(file)
        except json.JSONDecodeError:
            logging.error(f"Ошибка при чтении файла {file_path}")
            return {}
    return {}


def save_data(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=4)


def order_items_to_dict(order_items):
    return [item.to_dict() for item in order_items]


def dict_to_order_items(data):
    return [OrderItem.from_dict(item) for item in data]


user_to_id = load_data(user_data_file)
order_storage = {k: dict_to_order_items(v) for k, v in load_data(order_data_file).items()}


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


async def send_invoice(chat_id, order_items):
    title = 'Счет за заказ'
    description = '\n'.join([f'{item.amount}x {get_item_by_id(item.id)["name"]} - {item.price} RUB' for item in order_items])
    payload = str(len(order_storage) + 1)
    order_storage[payload] = order_items
    save_data(order_data_file, {k: order_items_to_dict(v) for k, v in order_storage.items()})  # Сохранение данных заказов
    provider_token = '381764678:TEST:85681'
    start_parameter = 'start'
    currency = 'RUB'
    prices = [LabeledPrice(label=f'{item.amount}x {get_item_by_id(item.id)["name"]}', amount=item.price * 100) for item in order_items]

    await bot.send_invoice(
        chat_id=chat_id,
        title=title,
        description=description,
        payload=payload,
        provider_token=provider_token,
        start_parameter=start_parameter,
        prices=prices,
        currency=currency)


@app.route('/send_invoice', methods=['GET'])
def webhook_handler():
    telegram_id = request.args.get('telegram-tag')
    mutable_dict = MultiDict(request.args)

    order_items_list = []

    item_amounts = mutable_dict.getlist('item-amount')
    item_ids = mutable_dict.getlist('itemID')
    item_options_list = mutable_dict.getlist('itemOptions')

    for amount, item_id, item_options in zip(item_amounts, item_ids, item_options_list):
        item_id = int(item_id)
        amount = int(amount)
        options = json.loads(item_options)

        # Проверка наличия товара в меню
        menu_item = get_item_by_id(item_id)
        if not menu_item:
            return jsonify({'error': f'Item with ID {item_id} not found'}), 400

        # Проверка корректности опций
        for option_key in options.keys():
            if option_key not in menu_item['available_options']:
                return jsonify({'error': f'Invalid option {option_key} for item with ID {item_id}'}), 400

        # Расчет цены
        base_price = menu_item['base_price']
        total_price = calculate_price(base_price, options) * amount

        # Создание объекта OrderItem и заполнение поля price
        order_item = OrderItem(amount=amount, id=item_id, options=options, price=-1)
        order_item.price = total_price
        order_items_list.append(order_item)

    chat_id = user_to_id.get(telegram_id)

    if chat_id:
        asyncio.run_coroutine_threadsafe(send_invoice(chat_id, order_items_list), loop)
        bot_username = 'LavandaCoffee_bot'
        telegram_url = f'tg://resolve?domain={bot_username}'
        return redirect(telegram_url)

    return jsonify({'error': 'User not registered'}), 400


async def pre_checkout_callback(update, context):
    query = update.pre_checkout_query
    try:
        payload = query.invoice_payload
        logging.info(f"Received payload: {payload}")

        if payload not in order_storage:
            logging.error("Payload not found in order storage")
            raise ValueError("Payload not found in order storage")

        order_items = order_storage[payload]

        valid_payload = []
        total_amount = 0

        for item in order_items:
            menu_item = get_item_by_id(item.id)
            if not menu_item:
                logging.error(f"Item with ID {item.id} not found.")
                await query.answer(ok=False, error_message=f"Item with ID {item.id} not found.")
                return

            for option_key in item.options.keys():
                if option_key not in menu_item['available_options']:
                    logging.error(f"Invalid option {option_key} for item with ID {item.id}.")
                    await query.answer(ok=False, error_message=f"Invalid option {option_key} for item with ID {item.id}.")
                    return

            base_price = menu_item['base_price']
            total_price = calculate_price(base_price, item.options) * item.amount
            total_amount += total_price
            valid_payload.append(item)

        # Проверка суммы заказа
        if total_amount != query.total_amount / 100:
            logging.error("Incorrect total amount.")
            await query.answer(ok=False, error_message="Incorrect total amount.")
            return

        logging.info("Sending ok=True response to query.answer")
        await query.answer(ok=True)

    except (json.JSONDecodeError, ValueError) as e:
        logging.error(f"Payload error: {str(e)}")
        await query.answer(ok=False, error_message=f"Payload error: {str(e)}")
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        await query.answer(ok=False, error_message=f"Unexpected error: {str(e)}")


async def successful_payment_callback(update, context):
    await context.bot.send_message(update.message.chat_id, 'Успешно купили')


async def start(update, context):
    chat_id = update.message.chat_id
    username = update.message.from_user.username
    if username:
        user_to_id['@' + username] = chat_id
        save_data(user_data_file, user_to_id)  # Сохранение данных пользователей
        await update.message.reply_text(f'Ваш chat ID: {chat_id} и username: @{username} сохранены.')
    else:
        await update.message.reply_text('У вас нет username. Пожалуйста, установите его в настройках Telegram.')


def main():
    application.add_handler(PreCheckoutQueryHandler(pre_checkout_callback))
    application.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment_callback))
    application.add_handler(CommandHandler("start", start))

    from threading import Thread
    flask_thread = Thread(target=lambda: app.run(port=5000))
    flask_thread.start()

    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()
