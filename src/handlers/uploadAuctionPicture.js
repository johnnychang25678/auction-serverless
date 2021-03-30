import { getAuctionById } from './getAuction'
import { uploadPictureToS3 } from '../lib/uploadPictureToS3'
import { setAuctionPictureUrl } from '../lib/setAuctionPictureUrl'
import middy from '@middy/core'
import httpErrorHander from '@middy/http-error-handler'
import createError from 'http-errors'

export async function uploadAuctionPicture(event) {
  try {
    const { id } = event.pathParameters
    const { email } = event.requestContext.authorizer
    const auction = await getAuctionById(id)

    if (auction.seller !== email) {
      throw new createError.Forbidden('You are not the seller for this auction!')
    }
    
    // need to strip off some charaters to store in S3`
    const base64 = event.body.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64, 'base64')

    const pictureUrl = await uploadPictureToS3(auction.id + '.jpg', buffer)
    const updatedAuction = await setAuctionPictureUrl(auction.id, pictureUrl)

    return {
      statusCode: 200,
      body: JSON.stringify(updatedAuction)
    }
  } catch (err) {
    console.error(err)
    throw new createError.InternalServerError(err)
  }
}

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHander())