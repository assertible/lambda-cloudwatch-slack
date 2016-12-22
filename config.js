module.exports = {

  kmsEncryptedHookUrl: "<kmsEncryptedHookUrl>", // encrypted slack webhook url
  unencryptedHookUrl: "<unencryptedHookUrl>", // unencrypted slack webhook url
  slackChannel: "#general",  // slack channel to send a message to
  slackUsername: "AWS SNS via Lamda", // slack username to user for messages
  icon_emoji: ":robot_face:", // slack emoji icon to use for messages
  orgIcon: "", // url to icon for your organization for display in the footer of messages
  orgName: "", // name of your organization for display in the footer of messages
  services: {
    elasticbeanstalk: {
      match_text: "ElasticBeanstalkNotifications" // text in the sns message or topicname to match on to process this service type
    },
    cloudwatch: {
      match_text: "CloudWatchNotifications" // text in the sns message or topicname to match on to process this service type
    },
    codedeploy: {
      match_text: "CodeDeploy" // text in the sns message or topicname to match on to process this service type
    },
    elasticache: {
      match_text: "ElastiCache" // text in the sns message or topicname to match on to process this service type
    },
    autoscaling: {
      match_text: "AutoScaling" // text in the sns message or topicname to match on to process this service type
    }
  }

}
