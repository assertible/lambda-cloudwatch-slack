module.exports = {

  kmsEncryptedHookUrl: process.env.kmsEncryptedHookUrl, // encrypted slack webhook url
  unencryptedHookUrl: process.env.unencryptedHookUrl,   // unencrypted slack webhook url
  slackChannel: process.env.slackChannel,      // slack channel to send a message to
  slackUsername: process.env.slackUsername,    // slack username to user for messages
  icon_emoji: process.env.icon_emoji,          // slack emoji icon to use for messages
  orgIcon: process.env.orgIcon,                // url to icon for your organization for display in the footer of messages
  orgName: process.env.orgName,                // name of your organization for display in the footer of messages
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
