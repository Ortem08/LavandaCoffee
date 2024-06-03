from flask import Flask, request, redirect, jsonify
from telegram import LabeledPrice, Bot, Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    PreCheckoutQueryHandler,
    ShippingQueryHandler,
    filters,
)
import asyncio
import json

app = Flask(__name__)
TOKEN = '7106122843:AAEFkPrGsz1ge_AREhqZb5s5wNdDbffgyLk'
bot = Bot(token=TOKEN)
application = Application.builder().token(TOKEN).build()

loop = asyncio.get_event_loop()
user_to_id = {}


async def send_invoice(chat_id):
    title = 'Название Книги'
    description = 'Описание книги'
    payload = '1235415151'
    provider_token = '381764678:TEST:85681'
    start_parameter = 'start'
    currency = 'RUB'
    prices = [{'label': 'Foo', 'amount': 10000}, {'label': 'Bar', 'amount': 50000}, {'label': 'Foo', 'amount': 10000}]

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
    telegram_id = request.args.get('telegramId')
    chat_id = user_to_id.get(telegram_id)

    if chat_id:
        asyncio.run_coroutine_threadsafe(send_invoice(chat_id), loop)
        bot_username = 'LavandaCoffee_bot'
        telegram_url = f'tg://resolve?domain={bot_username}'
        return redirect(telegram_url)

    return jsonify({'error': 'User not registered'}), 400


async def pre_checkout_callback(update, context):
    query = update.pre_checkout_query
    if query.invoice_payload != '1235415151':
        print('ATTENTION')
        await query.answer(ok=False, error_message="Ошибка в данных платежа.")
    else:
        print('ok')
        await query.answer(ok=True)


async def successful_payment_callback(update, context):
    await context.bot.send_message(update.message.chat_id, 'Успешно купили')


async def start(update, context):
    chat_id = update.message.chat_id
    username = update.message.from_user.username
    if username:
        user_to_id['@' + username] = chat_id
        print(user_to_id)
        await update.message.reply_text(
            f'Ваш chat ID: {chat_id} и username: @{username} сохранены.')
    else:
        await update.message.reply_text(
            'У вас нет username. Пожалуйста, установите его в настройках Telegram.')


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
