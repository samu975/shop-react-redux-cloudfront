const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';

exports.catalogBatchProcess = async (event) => {
  try {
    const products = [];

    for (const record of event.Records) {
      const { body } = record;
      const productData = JSON.parse(body);
      const product = {
        id: Math.random().toString(36).substring(7),
        name: productData.name,
        price: productData.price,
      };

      products.push(product);
    }

    await Promise.all(
      products.map((product) =>
        dynamoDB
          .put({
            TableName: PRODUCTS_TABLE,
            Item: product,
          })
          .promise()
      )
    );

    await notifySnsTopic();

    return {
      statusCode: 200,
      body: JSON.stringify('Products created successfully'),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify('Error processing SQS event'),
    };
  }
};

const notifySnsTopic = async () => {
  const sns = new AWS.SNS();

  await sns
    .publish({
      Message: 'Products created successfully',
      Subject: 'Products Created',
      TopicArn: process.env.createProductTopic,
    })
    .promise();
};
