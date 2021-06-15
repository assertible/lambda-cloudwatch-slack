NODE_LAMBDA=./node_modules/node-lambda/bin/node-lambda

test -s $NODE_LAMBDA || { echo "node-lambda not installed. Run 'npm install' first."; exit 1; }
mkdir -p tmp
cat .env | grep -v AWS > ./tmp/deploy.env
$NODE_LAMBDA deploy --configFile ./tmp/deploy.env
