import { createConfirmNotification } from '../utils/notification/notification-creator.js';
import { OrderList  } from '../utils/order-list.js';


const botUsername = 'LavandaCoffee_bot';
const telegramUrl = `tg://resolve?domain=${botUsername}`;

const SUBMIT_MESSAGE = `
<div class="submit-message">
    <span class="warning"><strong>        
        Если Вы не зарегистрированы в телеграм-боте&nbsp;<a href="${telegramUrl}">@${botUsername}</a>, 
        наши сотрудники не смогут принять Ваш заказ!
    </strong></span>
    <br><br>
    <span class="reminder">
        <span>При первом заказе</span>
        <ol>
            <li>Нажмите "Зарегистрироваться".</li>
            <li>Запустите бота (кнопка "Старт").</li>
            <li>Вернитесь на сайт.</li>
            <li>Нажмите "Заказать".</li>
        </ol>
    </span>
</div>
`;

const submitButton = document
    .getElementsByClassName('submit-button')[0];

submitButton.addEventListener('click', createSubmitNotification);

const form = document
    .getElementsByClassName('cart-form')[0];

const orderList = new OrderList();

function submitForm() {
    if (form.checkValidity()) {
        form.submit();
        orderList.clear_all();
    } else {
        form.reportValidity();
    }
}

function createSubmitNotification (event) {
    event.preventDefault();

    const submitNotification = document.getElementsByClassName('confirm-submit') [0];
    if (submitNotification) {
        console.log(submitNotification);
        console.log("УЖЕ ЕСТЬ");

        return;
    }

    const { denyButton, confirmButton, redirectButton }
        = _createNotificationButtons();

    const notification = createConfirmNotification(SUBMIT_MESSAGE, 'confirm-submit',
        confirmButton, denyButton);

    _appendNotificationElements(notification, redirectButton, denyButton);
}

function createButton (buttonText, idName, onClickAction) {
    const button =  document.createElement('button');

    button.id = idName;
    button.innerHTML = buttonText;

    if (onClickAction){
        button.addEventListener('click', onClickAction);
    }

    return button;
}

function redirectToTelegramBot() {
    window.location.href = telegramUrl;
}

function _createNotificationButtons () {
    const denyButton =  createButton("Отме&shy;на",
        "deny-button");
    const confirmButton =  createButton("Зака&shy;зать",
        "confirm-button", submitForm);
    const redirectButton =  createButton("Зарегистриро&shy;ваться",
        "redirect-button", redirectToTelegramBot);

    return { denyButton, confirmButton, redirectButton };
}

function _appendNotificationElements (notification, redirectButton, denyButton) {
    const buttonHolder = notification.getElementsByClassName('button-holder')[0];
    buttonHolder.insertBefore(redirectButton, denyButton);
}