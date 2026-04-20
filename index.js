const { KMSClient, DecryptCommand } = require('@aws-sdk/client-kms');
var url = require('url');
var https = require('https');
var config = require('./config');
var _ = require('lodash');
var hookUrl;


const DEBUG_LOGGING = process.env.DEBUG_LOGGING === 'true';
function logDebug(...args) {
  if (DEBUG_LOGGING) {
    console.log('[DEBUG]', ...args);
  }
}

var baseSlackMessage = {}

var postMessage = function(message, callback) {
  logDebug('Preparing to post message to Slack:', JSON.stringify(message));
  var body = JSON.stringify(message);
  var options = url.parse(hookUrl);
  options.method = 'POST';
  options.headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  };

  logDebug('HTTPS request options:', options);
  var postReq = https.request(options, function(res) {
    var chunks = [];
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      logDebug('Received chunk from Slack response:', chunk);
      return chunks.push(chunk);
    });
    res.on('end', function() {
      var body = chunks.join('');
      logDebug('Slack response ended. Status:', res.statusCode, res.statusMessage, 'Body:', body);
      if (callback) {
        callback({
          body: body,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage
        });
      }
    });
    return res;
  });

  postReq.on('error', function(err) {
    logDebug('Error posting to Slack:', err);
  });
  postReq.write(body);
  postReq.end();
};

var handleElasticBeanstalk = function(event, context) {
  logDebug('Handling ElasticBeanstalk event:', JSON.stringify(event));
  var timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000;
  var subject = event.Records[0].Sns.Subject || "AWS Elastic Beanstalk Notification";
  var message = event.Records[0].Sns.Message;

  var stateRed = message.indexOf(" to RED");
  var stateSevere = message.indexOf(" to Severe");
  var butWithErrors = message.indexOf(" but with errors");
  var noPermission = message.indexOf("You do not have permission");
  var failedDeploy = message.indexOf("Failed to deploy application");
  var failedConfig = message.indexOf("Failed to deploy configuration");
  var failedQuota = message.indexOf("Your quota allows for 0 more running instance");
  var unsuccessfulCommand = message.indexOf("Unsuccessful command execution");

  var stateYellow = message.indexOf(" to YELLOW");
  var stateDegraded = message.indexOf(" to Degraded");
  var stateInfo = message.indexOf(" to Info");
  var removedInstance = message.indexOf("Removed instance ");
  var addingInstance = message.indexOf("Adding instance ");
  var abortedOperation = message.indexOf(" aborted operation.");
  var abortedDeployment = message.indexOf("some instances may have deployed the new application version");

  var color = "good";

  if (stateRed != -1 || stateSevere != -1 || butWithErrors != -1 || noPermission != -1 || failedDeploy != -1 || failedConfig != -1 || failedQuota != -1 || unsuccessfulCommand != -1) {
    color = "danger";
  }
  if (stateYellow != -1 || stateDegraded != -1 || stateInfo != -1 || removedInstance != -1 || addingInstance != -1 || abortedOperation != -1 || abortedDeployment != -1) {
    color = "warning";
  }

  var slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "fields": [
          { "title": "Subject", "value": event.Records[0].Sns.Subject, "short": false},
          { "title": "Message", "value": message, "short": false}
        ],
        "color": color,
        "ts":  timestamp
      }
    ]
  };

  return _.merge(slackMessage, baseSlackMessage);
};

var handleCodeDeploy = function(event, context) {
  logDebug('Handling CodeDeploy event:', JSON.stringify(event));
  var subject = "AWS CodeDeploy Notification";
  var timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000;
  var snsSubject = event.Records[0].Sns.Subject;
  var message;
  var fields = [];
  var color = "warning";

  try {
    message = JSON.parse(event.Records[0].Sns.Message);

    if(message.status === "SUCCEEDED"){
      color = "good";
    } else if(message.status === "FAILED"){
      color = "danger";
    }
    fields.push({ "title": "Message", "value": snsSubject, "short": false });
    fields.push({ "title": "Deployment Group", "value": message.deploymentGroupName, "short": true });
    fields.push({ "title": "Application", "value": message.applicationName, "short": true });
    fields.push({
      "title": "Status Link",
      "value": "https://console.aws.amazon.com/codedeploy/home?region=" + message.region + "#/deployments/" + message.deploymentId,
      "short": false
    });
  }
  catch(e) {
    color = "good";
    message = event.Records[0].Sns.Message;
    fields.push({ "title": "Message", "value": snsSubject, "short": false });
    fields.push({ "title": "Detail", "value": message, "short": false });
  }


  var slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "color": color,
        "fields": fields,
        "ts": timestamp
      }
    ]
  };

  return _.merge(slackMessage, baseSlackMessage);
};

var handleCodePipeline = function(event, context) {
  logDebug('Handling CodePipeline event:', JSON.stringify(event));
  var subject = "AWS CodePipeline Notification";
  var timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000;
  var snsSubject = event.Records[0].Sns.Subject;
  var message;
  var fields = [];
  var color = "warning";
  var changeType = "";

  try {
    message = JSON.parse(event.Records[0].Sns.Message);
    detailType = message['detail-type'];

    if(detailType === "CodePipeline Pipeline Execution State Change"){
      changeType = "";
    } else if(detailType === "CodePipeline Stage Execution State Change"){
      changeType = "STAGE " + message.detail.stage;
    } else if(detailType === "CodePipeline Action Execution State Change"){
      changeType = "ACTION";
    }

    if(message.detail.state === "SUCCEEDED"){
      color = "good";
    } else if(message.detail.state === "FAILED"){
      color = "danger";
    }
    header = message.detail.state + ": CodePipeline " + changeType;
    fields.push({ "title": "Message", "value": header, "short": false });
    fields.push({ "title": "Pipeline", "value": message.detail.pipeline, "short": true });
    fields.push({ "title": "Region", "value": message.region, "short": true });
    fields.push({
      "title": "Status Link",
      "value": "https://console.aws.amazon.com/codepipeline/home?region=" + message.region + "#/view/" + message.detail.pipeline,
      "short": false
    });
  }
  catch(e) {
    color = "good";
    message = event.Records[0].Sns.Message;
    header = message.detail.state + ": CodePipeline " + message.detail.pipeline;
    fields.push({ "title": "Message", "value": header, "short": false });
    fields.push({ "title": "Detail", "value": message, "short": false });
  }


  var slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "color": color,
        "fields": fields,
        "ts": timestamp
      }
    ]
  };

  return _.merge(slackMessage, baseSlackMessage);
};

var handleElasticache = function(event, context) {
  logDebug('Handling Elasticache event:', JSON.stringify(event));
  var subject = "AWS ElastiCache Notification"
  var message = JSON.parse(event.Records[0].Sns.Message);
  var timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000;
  var region = event.Records[0].EventSubscriptionArn.split(":")[3];
  var eventname, nodename;
  var color = "good";

  for(key in message){
    eventname = key;
    nodename = message[key];
    break;
  }
  var slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "color": color,
        "fields": [
          { "title": "Event", "value": eventname.split(":")[1], "short": true },
          { "title": "Node", "value": nodename, "short": true },
          {
            "title": "Link to cache node",
            "value": "https://console.aws.amazon.com/elasticache/home?region=" + region + "#cache-nodes:id=" + nodename + ";nodes",
            "short": false
          }
        ],
        "ts": timestamp
      }
    ]
  };
  return _.merge(slackMessage, baseSlackMessage);
};

var handleCloudWatch = function(event, context) {
  logDebug('Handling CloudWatch event:', JSON.stringify(event));
  var timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000;
  var message = JSON.parse(event.Records[0].Sns.Message);
  var region = event.Records[0].EventSubscriptionArn.split(":")[3];
  var subject = "AWS CloudWatch Notification";
  var alarmName = message.AlarmName;
  var metricName = message.Trigger.MetricName;
  var oldState = message.OldStateValue;
  var newState = message.NewStateValue;
  var alarmDescription = message.AlarmDescription;
  var alarmReason = message.NewStateReason;
  var trigger = message.Trigger;
  var color = "warning";

  if (message.NewStateValue === "ALARM") {
      color = "danger";
  } else if (message.NewStateValue === "OK") {
      color = "good";
  }

  var slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "color": color,
        "fields": [
          { "title": "Alarm Name", "value": alarmName, "short": true },
          { "title": "Alarm Description", "value": alarmDescription, "short": false},
          {
            "title": "Trigger",
            "value": trigger.Statistic + " "
              + metricName + " "
              + trigger.ComparisonOperator + " "
              + trigger.Threshold + " for "
              + trigger.EvaluationPeriods + " period(s) of "
              + trigger.Period + " seconds.",
              "short": false
          },
          { "title": "Old State", "value": oldState, "short": true },
          { "title": "Current State", "value": newState, "short": true },
          {
            "title": "Link to Alarm",
            "value": "https://console.aws.amazon.com/cloudwatch/home?region=" + region + "#alarm:alarmFilter=ANY;name=" + encodeURIComponent(alarmName),
            "short": false
          }
        ],
        "ts":  timestamp
      }
    ]
  };
  return _.merge(slackMessage, baseSlackMessage);
};

var handleAutoScaling = function(event, context) {
  logDebug('Handling AutoScaling event:', JSON.stringify(event));
  var subject = "AWS AutoScaling Notification"
  var message = JSON.parse(event.Records[0].Sns.Message);
  var timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000;
  var eventname, nodename;
  var color = "good";

  for(key in message){
    eventname = key;
    nodename = message[key];
    break;
  }
  var slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "color": color,
        "fields": [
          { "title": "Message", "value": event.Records[0].Sns.Subject, "short": false },
          { "title": "Description", "value": message.Description, "short": false },
          { "title": "Event", "value": message.Event, "short": false },
          { "title": "Cause", "value": message.Cause, "short": false }

        ],
        "ts": timestamp
      }
    ]
  };
  return _.merge(slackMessage, baseSlackMessage);
};

var handleCatchAll = function(event, context) {
  logDebug('Handling CatchAll event:', JSON.stringify(event));

    var record = event.Records[0]
    var subject = record.Sns.Subject
    var timestamp = new Date(record.Sns.Timestamp).getTime() / 1000;
    var message = JSON.parse(record.Sns.Message)
    var color = "warning";

    if (message.NewStateValue === "ALARM") {
        color = "danger";
    } else if (message.NewStateValue === "OK") {
        color = "good";
    }

    // Add all of the values from the event message to the Slack message description
    var description = ""
    for(key in message) {

        var renderedMessage = typeof message[key] === 'object'
                            ? JSON.stringify(message[key])
                            : message[key]

        description = description + "\n" + key + ": " + renderedMessage
    }

    var slackMessage = {
        text: "*" + subject + "*",
        attachments: [
          {
            "color": color,
            "fields": [
              { "title": "Message", "value": record.Sns.Subject, "short": false },
              { "title": "Description", "value": description, "short": false }
            ],
            "ts": timestamp
          }
        ]
    }

  return _.merge(slackMessage, baseSlackMessage);
}

var processEvent = function(event, context) {
  logDebug('SNS event received:', JSON.stringify(event, null, 2));
  var slackMessage = null;
  var eventSubscriptionArn = event.Records[0].EventSubscriptionArn;
  var eventSnsSubject = event.Records[0].Sns.Subject || 'no subject';
  var eventSnsMessageRaw = event.Records[0].Sns.Message;
  var eventSnsMessage = null;

  try {
    eventSnsMessage = JSON.parse(eventSnsMessageRaw);
    logDebug('Parsed SNS message:', eventSnsMessage);
  }
  catch (e) {
    logDebug('Failed to parse SNS message as JSON:', eventSnsMessageRaw);
  }

  if(eventSubscriptionArn.indexOf(config.services.codepipeline.match_text) > -1 || eventSnsSubject.indexOf(config.services.codepipeline.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.codepipeline.match_text) > -1){
    logDebug('Processing codepipeline notification');
    slackMessage = handleCodePipeline(event,context)
  }
  else if(eventSubscriptionArn.indexOf(config.services.elasticbeanstalk.match_text) > -1 || eventSnsSubject.indexOf(config.services.elasticbeanstalk.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.elasticbeanstalk.match_text) > -1){
    logDebug('Processing elasticbeanstalk notification');
    slackMessage = handleElasticBeanstalk(event,context)
  }
  else if(eventSnsMessage && 'AlarmName' in eventSnsMessage && 'AlarmDescription' in eventSnsMessage){
    logDebug('Processing cloudwatch notification');
    slackMessage = handleCloudWatch(event,context);
  }
  else if(eventSubscriptionArn.indexOf(config.services.codedeploy.match_text) > -1 || eventSnsSubject.indexOf(config.services.codedeploy.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.codedeploy.match_text) > -1){
    logDebug('Processing codedeploy notification');
    slackMessage = handleCodeDeploy(event,context);
  }
  else if(eventSubscriptionArn.indexOf(config.services.elasticache.match_text) > -1 || eventSnsSubject.indexOf(config.services.elasticache.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.elasticache.match_text) > -1){
    logDebug('Processing elasticache notification');
    slackMessage = handleElasticache(event,context);
  }
  else if(eventSubscriptionArn.indexOf(config.services.autoscaling.match_text) > -1 || eventSnsSubject.indexOf(config.services.autoscaling.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.autoscaling.match_text) > -1){
    logDebug('Processing autoscaling notification');
    slackMessage = handleAutoScaling(event, context);
  }
  else{
    logDebug('Processing catch-all notification');
    slackMessage = handleCatchAll(event, context);
  }

  postMessage(slackMessage, function(response) {
    logDebug('Slack postMessage response:', response);
    if (response.statusCode < 400) {
      logDebug('Message posted successfully');
      context.succeed();
    } else if (response.statusCode < 500) {
      logDebug('Error posting message to slack API:', response.statusCode, response.statusMessage);
      // Don't retry because the error is due to a problem with the request
      context.succeed();
    } else {
      // Let Lambda retry
      logDebug('Server error when processing message:', response.statusCode, response.statusMessage);
      context.fail("server error when processing message: " + response.statusCode + " - " + response.statusMessage);
    }
  });
};

exports.handler = async function(event, context) {
  logDebug('Lambda handler invoked');
  if (hookUrl) {
    logDebug('Using cached hookUrl');
    processEvent(event, context);
    logDebug('Finished using cached hookUrl');
  } else if (config.unencryptedHookUrl) {
    logDebug('Using unencryptedHookUrl from config');
    hookUrl = config.unencryptedHookUrl;
    processEvent(event, context);
    logDebug('Finished using unencryptedHookUrl from config');
  } else if (config.kmsEncryptedHookUrl && config.kmsEncryptedHookUrl !== '<kmsEncryptedHookUrl>') {
    try {
      logDebug('Decrypting KMS encrypted hook URL');
      const encryptedBuf = Buffer.from(config.kmsEncryptedHookUrl, 'base64');
      const kmsClient = new KMSClient();
      const command = new DecryptCommand({ CiphertextBlob: encryptedBuf });
      const data = await kmsClient.send(command);
      logDebug('Decryption complete');
      logDebug('Decrypted hookUrl:', data.Plaintext.toString('ascii'));
      hookUrl = "https://" + data.Plaintext.toString('ascii');
      logDebug('Processing event with decrypted hookUrl from config');
      processEvent(event, context);
      logDebug('Finished using decrypted hookUrl from config');
    } catch (err) {
      logDebug('Decrypt error:', err);
      processEvent(event, context);
    }
  } else {
    logDebug('No hook URL set. Failing.');
    context.fail('hook url has not been set.');
  }
};
