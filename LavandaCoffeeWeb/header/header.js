import { OrderList } from "../utils/order-list.js";


document
    .getElementById('telegram-register-button')
    .addEventListener('click', redirectToTelegramBot);

const cartCounters = document
    .querySelectorAll('.cart-counter');

initOrderCount();
window.addEventListener('orderListSave', changeOrderCount);

function redirectToTelegramBot() {
    const botUsername = 'LavandaCoffee_bot';
    const url = `tg://resolve?domain=${botUsername}`;
    window.location.href = url;
}

function changeOrderCount (event) {
    cartCounters.forEach(c => c.textContent = event.detail.orderCount);
}

function initOrderCount () {
    const orderList = new OrderList();
    orderList.load();

    cartCounters.forEach(c => c.textContent = orderList.orderCount);
}