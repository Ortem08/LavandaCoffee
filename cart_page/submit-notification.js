import { createConfirmNotification, createTimeoutNotification } from '../utils/notification/notification-creator.js';
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
let telegramTag = form
    .getElementsByClassName('telegram-tag-input')[0];

telegramTag.addEventListener('change', () => {
    telegramTag.setCustomValidity("");
});

const orderList = new OrderList();

checkRegister();

function checkRegister () {
    const unregisteredString = window.location.href.split('?').slice(1)[0];
    const unregistered = unregisteredString.slice(13, 17) === 'true';

    if (unregistered) {
        pointOutErrorsForUnregistered();
    } else {
        createNotificationForRegistered();
    }
}

function createNotificationForRegistered () {
    const lastTelegramTag = localStorage.getItem('tagTG');
    const message =`
        <div>
            Счёт на оплату был отправлен в сообщении в
            <a href="${telegramUrl}">@${botUsername}</a> 
            пользователю ${lastTelegramTag}!
        </div>
    `;
    createTimeoutNotification(
        message,
        'for-registered',
        10000
    )

    localStorage.removeItem('tagTG');
    localStorage.removeItem('last_order');
}

function pointOutErrorsForUnregistered () {
    const lastTelegramTag = localStorage.getItem('tagTG');
    const lastOrder = localStorage.getItem('last_order');

    if (!(lastTelegramTag && lastOrder)) {
        return;
    }

    localStorage.setItem(
        "cart_processed",
        lastOrder
    );

    telegramTag.value = lastTelegramTag;
    telegramTag.setCustomValidity("Пользователь с таким тегом не зарегистрирован");
    form.reportValidity();
}


function submitForm() {
    if (form.checkValidity()) {
        localStorage.setItem(
            'tagTG', telegramTag.value
        );
        localStorage.setItem(
            "last_order",
            localStorage.getItem("cart_processed")
        );

        form.submit();
        orderList.clear_all();
    } else {
        form.reportValidity();
    }
}

// function submitForm() {
//     if (!(form.checkValidity() && checkFormSubmit())) {
//         form.reportValidity();
//         console.log("Форма не была отправлена");
//         return;
//     }
//     console.log("Форма успешно отправлена");
//     // orderList.clear_all();
// }


// function checkFormSubmit() {
//     let isStatus400 = false;
//
//     fetch(form.action, {
//         method: form.method,
//         headers: _getFormHeaders(),
//         // mode: 'no-cors'
//     }).then(response => {
//         console.log(`Статус ответа: ${response.status}.`)
//         if (response.status === 400) {
//             telegramTag.setCustomValidity("Пользователь с таким тегом не зарегистрирован");
//             isStatus400 = true;
//         }
//     });
//
//     return !isStatus400;
// }

function createSubmitNotification (event) {
    event.preventDefault();

    const submitNotification = document.getElementsByClassName('confirm-submit') [0];
    if (submitNotification) {
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

function _getFormHeaders () {
    const formHeaders = new Headers();
    Array.from(form.elements)
        .forEach((element) => {
            const { name, value } = element;
            if (!!name){
                // console.log(name, value);
                formHeaders.append(encodeURI(name), encodeURI(value));
            }
        });
    return formHeaders;
}