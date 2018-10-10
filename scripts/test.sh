NODE_LAMBDA=./node_modules/node-lambda/bin/node-lambda

$NODE_LAMBDA run -x test/context.json -j test/sns-codepipeline-event-pipeline-started.json
$NODE_LAMBDA run -x test/context.json -j test/sns-codepipeline-event-stage-started.json
$NODE_LAMBDA run -x test/context.json -j test/sns-codepipeline-event-stage-succeeded.json
$NODE_LAMBDA run -x test/context.json -j test/sns-codepipeline-event-stage-failed.json
$NODE_LAMBDA run -x test/context.json -j test/sns-cloudwatch-event.json
$NODE_LAMBDA run -x test/context.json -j test/sns-event.json
$NODE_LAMBDA run -x test/context.json -j test/sns-elastic-beanstalk-event.json
$NODE_LAMBDA run -x test/context.json -j test/sns-codedeploy-event.json
$NODE_LAMBDA run -x test/context.json -j test/sns-codedeploy-configuration.json
$NODE_LAMBDA run -x test/context.json -j test/sns-elasticache-event.json
$NODE_LAMBDA run -x test/context.json -j test/sns-autoscaling-event.json