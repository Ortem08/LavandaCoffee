yc iam service-account create lavandacoffee-sa
yc resource-manager folder add-access-binding --id $FOLDER_ID --role ydb.admin \
  --service-account-name lavandacoffee-sa
yc iam key create --output authorized.key --service-account-name lavandacoffee-sa \
  --description "for serverless ydb"

ydb -d $YDB_DATABASE \
  --endpoint $YDB_ENDPOINT --sa-key-file authorized.key <<EOF
CREATE TABLE \`users\` (\`chat_id\` Int64 NOT NULL, \`user_tag\` Utf8 NOT NULL, PRIMARY KEY (\`chat_id\`));
CREATE TABLE \`orders\` (\`order_id\` Int64 NOT NULL, \`order_data\` Json DEFAULT "{}", PRIMARY KEY (\`order_id\`));
CREATE TABLE \`keys\` (\`public_key\` Utf8 NOT NULL, \`private_key\` Utf8 NOT NULL, \`created_at\` Datetime NOT NULL, \`status\` Utf8 NOT NULL, PRIMARY KEY (\`public_key\`));
EOF