module.exports = {

  kmsEncryptedHookUrl: process.env.KMS_ENCRYPTED_HOOK_URL, // encrypted slack webhook url
  unencryptedHookUrl: process.env.UNENCRYPTED_HOOK_URL,    // unencrypted slack webhook url
  slackChannel: process.env.SLACK_CHANNEL,                 // slack channel to send a message to
  slackUsername: process.env.SLACK_USERNAME,               // "AWS SNS via Lamda", // slack username to user for messages
  icon_emoji: process.env.ICON_EMOJI,                      // slack emoji icon to use for messages
  orgIcon: process.env.ORG_ICON,                           // url to icon for your organization for display in the footer of messages
  orgName: process.env.ORG_NAME,                           // name of your organization for display in the footer of messages

  services: {
    elasticbeanstalk: {
      // text in the sns message or topicname to match on to process this service type
      match_text: "ElasticBeanstalkNotifications"
    },
    cloudwatch: {
      // text in the sns message or topicname to match on to process this service type
      match_text: "CloudWatchNotifications"
    },
    codedeploy: {
      // text in the sns message or topicname to match on to process this service type
      match_text: "CodeDeploy"
    },
    codepipeline: {
      // text in the sns message or topicname to match on to process this service type
      match_text: "codepipeline-alerts"
    },
    elasticache: {
      // text in the sns message or topicname to match on to process this service type
      match_text: "ElastiCache"
    },
    autoscaling: {
      // text in the sns message or topicname to match on to process this service type
      match_text: "AutoScaling"
    }
  }

}
