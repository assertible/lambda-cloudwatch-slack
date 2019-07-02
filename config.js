module.exports = {
  kmsEncryptedHookUrl: process.env.KMS_ENCRYPTED_HOOK_URL, // encrypted slack webhook url
  unencryptedHookUrl: process.env.UNENCRYPTED_HOOK_URL,    // unencrypted slack webhook url

  mention: process.env.MENTION,

  services: {
    elasticbeanstalk: {
      // text in the sns message or topicname to match on to process this service type
      match_text: "ElasticBeanstalkNotifications"
    },
    cloudwatch: {     
    },
    codepipeline: {
      // text in the sns message or topicname to match on to process this service type
      match_text: "CodePipelineNotifications"
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
