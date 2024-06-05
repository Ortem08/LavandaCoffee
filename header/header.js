
document
    .getElementById('telegram-register-button')
    .addEventListener('click', redirectToTelegramBot);

function redirectToTelegramBot() {
    const botUsername = 'LavandaCoffee_bot';
    const url = `tg://resolve?domain=${botUsername}`;
    window.location.href = url;
}