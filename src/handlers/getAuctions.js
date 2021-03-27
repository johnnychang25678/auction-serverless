import AWS from 'aws-sdk'
import commonMiddleware from '../lib/commonMiddleware'
import createError from 'http-errors'

const dynamoDb = new AWS.DynamoDB.DocumentClient()

async function getAuctions(event, context) {
  let auctions

  try {
    const result = await dynamoDb.scan({
      TableName: process.env.AUCTIONS_TABLE_NAME
    }).promise()
    auctions = result.Items
  } catch (err) {
    console.error(err)
    throw new createError.InternalServerError(err)
  }


  return {
    statusCode: 200, 
    // lamda body needs to be string
    body: JSON.stringify(auctions),
  };
}

export const handler = commonMiddleware(getAuctions)



