import requests
import os

TOKEN = os.getenv("BOT_TOKEN")

webhook_url = "<GATEWAY_ADDRESS>"
url = f"https://api.telegram.org/bot{TOKEN}/setWebhook"
payload = {
    'url': webhook_url
}
response = requests.post(url, data=payload)
print(response.json())

