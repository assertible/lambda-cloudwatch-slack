NODE_LAMBDA=./node_modules/node-lambda/bin/node-lambda

$NODE_LAMBDA run -x test/context.json -j test/sns-cloudwatch-event.json
