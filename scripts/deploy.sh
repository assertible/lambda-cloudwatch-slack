LAMBDA_TEST=./node_modules/node-lambda/bin/node-lambda

test -s $LAMBDA_TEST || { echo "node-lambda not installed. Run 'npm install' first."; exit 1; }
mkdir -p tmp
cat .env | grep HOOK_URL > ./tmp/deploy.env
$LAMBDA_TEST deploy --configFile ./tmp/deploy.env