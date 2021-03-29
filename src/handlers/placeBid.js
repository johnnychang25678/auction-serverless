import AWS from 'aws-sdk'
import commonMiddleware from '../lib/commonMiddleware'
import createError from 'http-errors'
import {getAuctionById} from './getAuction'
import validator from '@middy/validator'
import placeBidSchema from '../lib/schemas/placeBidSchema'

const dynamoDb = new AWS.DynamoDB.DocumentClient()

async function placeBid(event, context) {
  const { id } = event.pathParameters // like req.params
  const { amount } = event.body

  const auction = await getAuctionById(id)

  if (auction.status !== 'OPEN') {
    throw new createError.Forbidden('You cannnot bid on closed auctions!')
  }

  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}!`)
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: {id},
    UpdateExpression: 'set highestBid.amount = :amount', // :amount
    ExpressionAttributeValues: {
      ':amount': amount
    },
    ReturnValues: 'ALL_NEW'
  }

  let updatedAuction

  try {
    const result = await dynamoDb.update(params).promise()
    updatedAuction = result.Attributes
  } catch (err) {
    console.error(err)
    throw new createError.InternalServerError(err)
  }

  return {
    statusCode: 200,
    // lamda body needs to be string
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = commonMiddleware(placeBid)
  .use(validator({
    inputSchema: placeBidSchema
  }))



