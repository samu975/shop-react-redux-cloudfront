// importFileParser.js

const AWS = require('aws-sdk');
const csv = require('csv-parser');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL || '';

exports.importFileParser = async (event) => {
  try {
    const s3Record = event.Records[0].s3;
    const s3ObjectKey = decodeURIComponent(
      s3Record.object.key.replace(/\+/g, ' ')
    );

    const products = [];

    const parser = s3
      .getObject({
        Bucket: s3Record.bucket.name,
        Key: s3ObjectKey,
      })
      .createReadStream()
      .pipe(csv());

    for await (const record of parser) {
      const product = {
        id: Math.random().toString(36).substring(7),
        name: record.name,
        price: parseFloat(record.price),
      };

      products.push(product);
    }

    await Promise.all(
      products.map((product) =>
        sqs
          .sendMessage({
            QueueUrl: SQS_QUEUE_URL,
            MessageBody: JSON.stringify(product),
          })
          .promise()
      )
    );

    return {
      statusCode: 200,
      body: JSON.stringify('CSV records sent to SQS successfully'),
    };
  } catch (error) {
    console.error('Error processing S3 event', error);
    return {
      statusCode: 500,
      body: JSON.stringify('Error processing S3 event'),
    };
  }
};
