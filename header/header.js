import { OrderList } from "../utils/order-list.js";


document
    .getElementById('telegram-register-button')
    .addEventListener('click', redirectToTelegramBot);

const cartCounter = document
    .getElementById('cart-counter');

const orderList = new OrderList();
orderList.load();

cartCounter.textContent = orderList.orderCount;

window.addEventListener('orderListSave', (event) => {
    cartCounter.textContent = event.detail.orderCount;
});

function redirectToTelegramBot() {
    const botUsername = 'LavandaCoffee_bot';
    const url = `tg://resolve?domain=${botUsername}`;
    window.location.href = url;
}