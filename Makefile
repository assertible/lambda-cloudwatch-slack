LAMBDA_TEST?=./node_modules/node-lambda/bin/node-lambda

all:
	npm build

.PHONY: deps
deps:
	npm install

.PHONY: test
test:
	$(LAMBDA_TEST) run -x test/context.json -j test/sns-codedeploy-event.json

.PHONY: test-codepipeline
test-codepipeline:
	$(LAMBDA_TEST) run -x test/context.json -j test/sns-codepipeline-event-pipeline-started.json
	$(LAMBDA_TEST) run -x test/context.json -j test/sns-codepipeline-event-stage-started.json
	$(LAMBDA_TEST) run -x test/context.json -j test/sns-codepipeline-event-stage-succeeded.json
	$(LAMBDA_TEST) run -x test/context.json -j test/sns-codepipeline-event-stage-failed.json


.PHONY: test-all
test-all: test test-codepipeline
	$(LAMBDA_TEST) run -x test/context.json -j test/sns-cloudwatch-event.json
	$(LAMBDA_TEST) run -x test/context.json -j test/sns-event.json
	$(LAMBDA_TEST) run -x test/context.json -j test/sns-elastic-beanstalk-event.json
	$(LAMBDA_TEST) run -x test/context.json -j test/sns-codedeploy-event.json
	$(LAMBDA_TEST) run -x test/context.json -j test/sns-codedeploy-configuration.json
	$(LAMBDA_TEST) run -x test/context.json -j test/sns-elasticache-event.json
	$(LAMBDA_TEST) run -x test/context.json -j test/sns-autoscaling-event.json

.PHONY: package
package:
	$(LAMBDA_TEST) package --functionName $(LAMBDA_FUNCTION_NAME)

.PHONY: deploy
deploy:	
	@test -s $(LAMBDA_TEST) || { echo "node-lambda not installed. Exec 'make deps' first."; exit 1; }
	mkdir -p tmp
	cat .env | grep HOOK_URL > ./tmp/deploy.env
	$(LAMBDA_TEST) deploy --configFile ./tmp/deploy.env
