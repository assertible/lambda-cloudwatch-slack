LAMBDA_TEST?=./node_modules/node-lambda/bin/node-lambda
LAMBDA_FUNCTION_NAME=
AWS_REGION=
AWS_ROLE=
AWS_PROFILE=default
CONFIG_FILE=deploy.env

all:
	npm build

.PHONY: deps
deps:
	npm install

.PHONY: test
test:
	@test -s $(CONFIG_FILE) || { echo "No lambda config file. Update deploy.env.example and copy it to deploy.env"; exit 1; }
	AWS_REGION=$(AWS_REGION) $(LAMBDA_TEST) --configFile=$(CONFIG_FILE) run -x test/context.json -j test/sns-codedeploy-event.json

.PHONY: test-codepipeline
test-codepipeline:
	@test -s $(CONFIG_FILE) || { echo "No lambda config file. Update deploy.env.example and copy it to deploy.env"; exit 1; }
	AWS_REGION=$(AWS_REGION) $(LAMBDA_TEST) --configFile=$(CONFIG_FILE) run -x test/context.json -j test/sns-codepipeline-event-pipeline-started.json
	AWS_REGION=$(AWS_REGION) $(LAMBDA_TEST) --configFile=$(CONFIG_FILE) run -x test/context.json -j test/sns-codepipeline-event-stage-started.json
	AWS_REGION=$(AWS_REGION) $(LAMBDA_TEST) --configFile=$(CONFIG_FILE) run -x test/context.json -j test/sns-codepipeline-event-stage-succeeded.json
	AWS_REGION=$(AWS_REGION) $(LAMBDA_TEST) --configFile=$(CONFIG_FILE) run -x test/context.json -j test/sns-codepipeline-event-stage-failed.json


.PHONY: test-all
test-all: test test-codepipeline
	AWS_REGION=$(AWS_REGION) $(LAMBDA_TEST) --configFile=$(CONFIG_FILE) run -x test/context.json -j test/sns-cloudwatch-event.json
	AWS_REGION=$(AWS_REGION) $(LAMBDA_TEST) --configFile=$(CONFIG_FILE) run -x test/context.json -j test/sns-codepipeline-event.json
	AWS_REGION=$(AWS_REGION) $(LAMBDA_TEST) --configFile=$(CONFIG_FILE) run -x test/context.json -j test/sns-event.json
	AWS_REGION=$(AWS_REGION) $(LAMBDA_TEST) --configFile=$(CONFIG_FILE) run -x test/context.json -j test/sns-elastic-beanstalk-event.json
	AWS_REGION=$(AWS_REGION) $(LAMBDA_TEST) --configFile=$(CONFIG_FILE) run -x test/context.json -j test/sns-codedeploy-event.json
	AWS_REGION=$(AWS_REGION) $(LAMBDA_TEST) --configFile=$(CONFIG_FILE) run -x test/context.json -j test/sns-codedeploy-configuration.json
	AWS_REGION=$(AWS_REGION) $(LAMBDA_TEST) --configFile=$(CONFIG_FILE) run -x test/context.json -j test/sns-elasticache-event.json
	AWS_REGION=$(AWS_REGION) $(LAMBDA_TEST) --configFile=$(CONFIG_FILE) run -x test/context.json -j test/sns-autoscaling-event.json

.PHONY: package
package:
	$(LAMBDA_TEST) package --functionName $(LAMBDA_FUNCTION_NAME)

.PHONY: deploy
deploy:
	@test -s $(CONFIG_FILE) || { echo "No lambda config file. Update deploy.env.example and copy it to deploy.env"; exit 1; }
	$(LAMBDA_TEST) deploy --functionName $(LAMBDA_FUNCTION_NAME) \
				--role $(AWS_ROLE) \
				--accessKey $(AWS_ACCESS_KEY_ID) \
				--secretKey $(AWS_ACCESS_KEY_SECRET) \
				--region $(AWS_REGION) \
				--configFile $(CONFIG_FILE) \
				--profile $(AWS_PROFILE)