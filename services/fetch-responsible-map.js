const AWS = require('aws-sdk');
const { resolve } = require('url');

// is needed for local testing
// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

const S3 = new AWS.S3();

module.exports = {
  fetchResponsibleList: () => {
    return new Promise((res, rej) => {
      try {
        const bucketName = 'slack-users-bucket';
        const objectKey = 'project-slack-user-map.json';
        S3.getObject(
          {
            Bucket: bucketName,
            Key: objectKey,
          },
          (err, data) => {
            if (err) {
              console.log('aws error', err);
              rej(err);
            } else {
              res(JSON.parse(data.Body));
            }
          }
        );
      } catch {
        process.exit(0);
        // rej(e);
      }
    });
  },
};
