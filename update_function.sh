yc serverless function version create --function-name lavandacoffee-bot-handler --runtime python312 \
  --environment BOT_TOKEN=$BOT_TOKEN,YDB_DATABASE=$YDB_DATABASE,YDB_ENDPOINT=$YDB_ENDPOINT \
  --source-path function.zip --execution-timeout 30s --memory 512MB --entrypoint ServerlessBot.main
