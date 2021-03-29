import AWS from 'aws-sdk'

const dynamoDb = new AWS.DynamoDB.DocumentClient()
const sqs = new AWS.SQS()

export async function closeAuction(auction) { // change status from OPEN to CLOSE
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: {id: auction.id},
    UpdateExpression: 'set #status = :status',
    ExpressionAttributeValues: {
      ':status': 'CLOSED',
    },
    ExpressionAttributeNames: {
      '#status': 'status' // 'status' is a reserved word
    }
  }

  await dynamoDb.update(params).promise()

  const {title, seller, highestBid} = auction
  const {amount, bidder} = highestBid
  if (!bidder) {
    await sqs.sendMessage({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: 'Your auction is expired with no bids',
        recipient: seller,
        body: 'No one bid on your item'
      })
    }).promise()
    return 
  }

  const notfifySeller = sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: 'Your item has been sold!',
      recipient: seller,
      body: `Woohoo! Your item "${title}" has been sold for $${amount}`
    })
  }).promise()

  const notfifyBidder = sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: 'You won an auction',
      recipient: bidder,
      body: `What a great deal! You got yourself a "${title}" for $${amount}`
    })
  }).promise()

  return Promise.all([notfifySeller, notfifyBidder])

  
}