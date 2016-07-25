
var AWS = require('aws-sdk');
var url = require('url');
var https = require('https');
var hookUrl, kmsEncyptedHookUrl, slackChannel;

// mandatory configuration
kmsEncyptedHookUrl = '<kmsEncryptedHookUrl>'

unencryptedHookUrl = null

slackChannel = '#dev';  // Enter the Slack channel to send a message to

// optional configuration
var slackUsername = null
var orgIcon = null


var postMessage = function(message, callback) {
    var body = JSON.stringify(message);
    var options = url.parse(hookUrl);
    options.method = 'POST';
    options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
    };

    var postReq = https.request(options, function(res) {
        var chunks = [];
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            return chunks.push(chunk);
        });
        res.on('end', function() {
            var body = chunks.join('');
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

    postReq.write(body);
    postReq.end();
};

var handleElasticBeanstalk = function(event, context) {

    console.log(JSON.stringify(event, null, 2));
    console.log('From SNS:', event.Records[0].Sns.Message);

    var subject = event.Records[0].Sns.Subject

    var message = event.Records[0].Sns.Message;

    var butWithErrors = message.indexOf(" but with errors");
    var stateRed = message.indexOf(" to RED");
    var stateYellow = message.indexOf(" to YELLOW");
    var noPermission = message.indexOf("You do not have permission");
    var failedDeploy = message.indexOf("Failed to deploy application");
    var removedInstance = message.indexOf("Removed instance ");
    var addingInstance = message.indexOf("Adding instance ");
    var failedConfig = message.indexOf("Failed to deploy configuration");
    var failedQuota = message.indexOf("Your quota allows for 0 more running instance");
    var abortedOperation = message.indexOf(" aborted operation.");
    var color = "good";

    if (stateRed != -1 || butWithErrors != -1 || noPermission != -1 || failedDeploy != -1 || failedConfig != -1 || failedQuota != -1) {
        color = "danger";
    }
    if (stateYellow != -1 || removedInstance != -1 || addingInstance != -1 || abortedOperation != -1) {
        color = "warning";
    }

    var slackMessage = {
        channel: slackChannel,
        username: slackUsername || "AWS SNS via Lamda",
        text: "*" + subject + "*",
        // text: "*" + event.Records[0].Sns.Subject + "*",
        icon_emoji: ":aws:",
        attachments: [
            {
                "color": color,
                "text": message
            }
        ]
    };

    return slackMessage
};

var handleCloudWatch = function(event, context) {

    var message = JSON.parse(event.Records[0].Sns.Message);

    var alarmName = message.AlarmName;
    var metricName = message.Trigger.MetricName;
    //var oldState = message.OldStateValue;
    var newState = message.NewStateValue;
    var reason = message.NewStateReason;
    var alarmDescription = message.AlarmDescription;
    var alarmReason = message.NewStateReason;

    var color = "warning";

    if (message.NewStateValue === "ALARM") {
        color = "danger";
    } else if (message.NewStateValue === "OK") {
        color = "good";
    }

    var slackMessage = {
        channel: slackChannel,
        username: slackUsername || "AWS SNS via Lamda",
        text: "*" + metricName + " state is now " + newState + "*",
        // text: "*" + event.Records[0].Sns.Subject + "*",
        icon_emoji: ":aws:",
        attachments: [
            {
                "fallback":  message.Trigger.Statistic + " "
                    + metricName + " "
                    + message.Trigger.ComparisonOperator + " "
                    + message.Trigger.Threshold,
                "color": color,
                // "pretext": "Optional text that appears above the attachment block",
                "author_name": alarmName,
                // "author_link": "http://flickr.com/bobby/",
                // "author_icon": "http://flickr.com/icons/bobby.jpg",
                "title": alarmDescription,
                "title_link": "https://api.slack.com/",
                "text": alarmReason,
                "fields": [
                    {
                        "title": "Trigger",
                        "value": message.Trigger.Statistic + " "
                            + metricName + " "
                            + message.Trigger.ComparisonOperator + " "
                            + message.Trigger.Threshold,
                        // "short": false
                    },
                    {
                        "title": "Old State",
                        "value": message.OldStateValue,
                        // "short": false
                    }
                ],
                // "image_url": "http://my-website.com/path/to/image.jpg",
                // "thumb_url": "http://example.com/path/to/thumb.png",
                "footer": message.Region,
                "footer_icon": orgIcon,
                "ts":  (new Date(message.StateChangeTime)).getTime()
            }
        ]
    };

    return slackMessage
};

var processEvent = function(event, context) {

    var slackMessage = null;
    try {
        var message = JSON.parse(event.Records[0].Sns.Message);
        slackMessage = handleCloudWatch(event,context);
    } catch (e) {
        slackMessage = handleElasticBeanstalk(event,context)
    }

    postMessage(slackMessage, function(response) {
        if (response.statusCode < 400) {
            console.info('Message posted successfully');
            context.succeed();
        } else if (response.statusCode < 500) {
            console.error("Error posting message to Slack API: "
                          + response.statusCode + " - "
                          + response.statusMessage);

            // Don't retry because the error is due to a problem with the request
            context.succeed();
        } else {
            // Let Lambda retry
            context.fail("Server error when processing message: "
                         + response.statusCode + " - "
                         + response.statusMessage);
        }
    });
};


exports.handler = function(event, context) {
    if (hookUrl) {
        // Container reuse, simply process the event with the key in memory
        processEvent(event, context);

    } else if (unencryptedHookUrl) {

        hookUrl = unencryptedHookUrl;
        processEvent(event, context);

    } else if (kmsEncyptedHookUrl && kmsEncyptedHookUrl !== '<kmsEncryptedHookUrl>') {

        var encryptedBuf = new Buffer(kmsEncyptedHookUrl, 'base64');
        var cipherText = { CiphertextBlob: encryptedBuf };
        var kms = new AWS.KMS();

        kms.decrypt(cipherText, function(err, data) {
            if (err) {
                console.log("Decrypt error: " + err);
                processEvent(event, context);
            } else {
                hookUrl = "https://" + data.Plaintext.toString('ascii');
                processEvent(event, context);
            }
        });
    } else {
        context.fail('Hook URL has not been set.');
    }
};
