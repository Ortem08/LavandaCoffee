import { createTimeoutNotification } from '../utils/notification/notification-creator.js';
import { OrderList  } from '../utils/order-list.js';

window.addEventListener('cartLoad', onCartLoaded);

const orderList = new OrderList();
orderList.load();

function onCartLoaded () {
    const itemCards = document.getElementsByClassName('item-card');

    for (const itemCard of itemCards) {
        const optionsButton = itemCard.getElementsByClassName('item-options') [0];
        optionsButton.addEventListener('click', (event) => {
            event.preventDefault();

            const itemOptions = JSON.parse(itemCard
                .getElementsByClassName('itemOptions')[0].value);

            const optionsString = Object.entries(itemOptions)
                .map(([_, values]) => values.join(', '))
                .join(', ');

            if (optionsString.length !== 0){
                createTimeoutNotification(`Выбранные опции: ${optionsString}.`);
            }
            else {
                createTimeoutNotification(`Нет выбранных опций.`);
            }
        });
    }
}

