import AWS from 'aws-sdk'
import commonMiddleware from '../lib/commonMiddleware'
import createError from 'http-errors'
import validator from '@middy/validator'
import getAuctionsSchema from '../lib/schemas/getAuctionsSchema'

const dynamoDb = new AWS.DynamoDB.DocumentClient()

async function getAuctions(event, context) {
  let auctions
  const {status} = event.queryStringParameters // like req.query

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndDate',
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeValues: {
      ':status': status
    },
    ExpressionAttributeNames: {
      '#status': 'status' // 'status' is a reserved word
    }
  }

  try {
    const result = await dynamoDb.query(params).promise()
    auctions = result.Items
    return {
    statusCode: 200, 
    // lamda body needs to be string
    body: JSON.stringify(auctions),
  }
  } catch (err) {
    console.error(err)
    throw new createError.InternalServerError(err)
  }
  
}

export const handler = commonMiddleware(getAuctions)
  .use(validator({
    inputSchema: getAuctionsSchema,
    useDefaults: true
  }))



