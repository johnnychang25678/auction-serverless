import AWS from 'aws-sdk'
import commonMiddleware from '../lib/commonMiddleware'
import createError from 'http-errors'

const dynamoDb = new AWS.DynamoDB.DocumentClient()

export async function getAuctionById(id) {
  let auction
  try {
    const result = await dynamoDb.get({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: { id }
    }).promise()
    auction = result.Item
  } catch (err) {
    console.error(err)
    throw new createError.InternalServerError(err)
  }

  if (!auction) {
    throw new createError.NotFound(`Auction with ID ${id} not found`)
  }

  return auction

}

async function getAuction(event, context) {
  const {id} = event.pathParameters // like req.params

  const auction = await getAuctionById(id)

  return {
    statusCode: 200,
    // lamda body needs to be string
    body: JSON.stringify(auction),
  };
}

export const handler = commonMiddleware(getAuction)



