import {v4 as uuid} from 'uuid'
import AWS from 'aws-sdk'
import commonMiddleware from '../lib/commonMiddleware'
import createError from 'http-errors'
import validator from '@middy/validator'
import createAuctionSchema from '../lib/schemas/createAuctionSchema'

const dynamoDb = new AWS.DynamoDB.DocumentClient()

async function createAuction(event, context) {
  const body = event.body
  const now = new Date()
  const endDate = new Date()
  endDate.setHours(now.getHours() + 1) // auction ends after an hour

  const auction = {
    id: uuid(),
    title: body.title,
    status: 'OPEN',
    createdAt: now.toISOString(), // convert time to string to store to DB
    endingAt: endDate.toISOString(), 
    highestBid: {
      amount: 0
    }

  }

  try {
    await dynamoDb.put({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Item: auction
    }).promise() // .promise() convert callback to Promise (aws sdk method)
  } catch (err) {
    console.error(err)
    throw new createError.InternalServerError(err)
  }

  
  return {
    statusCode: 201, // 201: resource created
    // lamda body needs to be string
    body: JSON.stringify(auction),
  };
}

export const handler = commonMiddleware(createAuction)
  .use(validator({
    inputSchema: createAuctionSchema
  }))


