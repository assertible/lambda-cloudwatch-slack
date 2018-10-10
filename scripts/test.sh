LAMBDA_TEST=./node_modules/node-lambda/bin/node-lambda

pwd

$LAMBDA_TEST run -x test/context.json -j test/sns-codepipeline-event-pipeline-started.json
$LAMBDA_TEST run -x test/context.json -j test/sns-codepipeline-event-stage-started.json
$LAMBDA_TEST run -x test/context.json -j test/sns-codepipeline-event-stage-succeeded.json
$LAMBDA_TEST run -x test/context.json -j test/sns-codepipeline-event-stage-failed.json
$LAMBDA_TEST run -x test/context.json -j test/sns-cloudwatch-event.json
$LAMBDA_TEST run -x test/context.json -j test/sns-event.json
$LAMBDA_TEST run -x test/context.json -j test/sns-elastic-beanstalk-event.json
$LAMBDA_TEST run -x test/context.json -j test/sns-codedeploy-event.json
$LAMBDA_TEST run -x test/context.json -j test/sns-codedeploy-configuration.json
$LAMBDA_TEST run -x test/context.json -j test/sns-elasticache-event.json
$LAMBDA_TEST run -x test/context.json -j test/sns-autoscaling-event.json