const products = require("./mockProducts");

exports.handler = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify(products),
    };
};
