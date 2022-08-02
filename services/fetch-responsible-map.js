const AWS = require('aws-sdk');
const { resolve } = require('url');

AWS.config.update({
  accessKeyId: process.env.REQUEST_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REQUEST_AWS_SECRET_ACCESS_KEY,
  region: process.env.REQUEST_AWS_REGION,
});

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
              process.exit(0);
              rej(err);
            } else {
              res(JSON.parse(data.Body));
            }
          }
        );
      } catch (e) {
        console.log('aws error', e);
        process.exit(0);
        // rej(e);
      }
    });
  },
};
