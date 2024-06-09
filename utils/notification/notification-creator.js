const LIFE_TIMEOUT = 2000;
const REMOVE_TIMEOUT = 300;

export function createTimeoutNotification(message, notificationType) {
    const notification = createNotification(message, notificationType);

    setTimeout(() => removeNotification(notification),
        LIFE_TIMEOUT);

    return notification;
}

export function createConfirmNotification(message, notificationType, confirmButton, denyButton) {
    const notification = createNotification(message, notificationType);

    const buttonHolder = document.createElement('div');
    buttonHolder.className = 'button-holder';
    notification.appendChild(buttonHolder);

    buttonHolder.appendChild(denyButton);
    buttonHolder.appendChild(confirmButton);

    denyButton.addEventListener('click', ()=> removeNotification(notification));
    confirmButton.addEventListener('click', ()=> removeNotification(notification));

    return notification;
}


function createNotification (message, notificationType) {
    const notification = document.createElement('div');
    notification.className = 'notification';

    if (notificationType) {
        notification.classList.add(notificationType);
    }

    notification.innerHTML = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    return notification;
}

function removeNotification (notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        notification.remove();
    }, REMOVE_TIMEOUT);
}
