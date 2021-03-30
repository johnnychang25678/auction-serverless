import { getAuctionById } from './getAuction'
import { uploadPictureToS3 } from '../lib/uploadPictureToS3'
import { setAuctionPictureUrl } from '../lib/setAuctionPictureUrl'
import middy from '@middy/core'
import validator from '@middy/validator'
import cors from '@middy/http-cors'
import httpErrorHander from '@middy/http-error-handler'
import createError from 'http-errors'
import uploadAuctionPictureSchema from '../lib/schemas/uploadAuctionPictureSchema'

export async function uploadAuctionPicture(event) {
  const { id } = event.pathParameters
  const { email } = event.requestContext.authorizer
  const auction = await getAuctionById(id)

  if (auction.seller !== email) {
    throw new createError.Forbidden('You are not the seller for this auction!')
  }
  
  // need to strip off some charaters to store in S3`
  const base64 = event.body.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64, 'base64')

  if (buffer.toString('base64') !== base64) {
    throw new createError.BadRequest('Invalid base64 string for image')
  }

  let updatedAuction
  
  try {
    const pictureUrl = await uploadPictureToS3(auction.id + '.jpg', buffer)
    updatedAuction = await setAuctionPictureUrl(auction.id, pictureUrl) 
  } catch (err) {
    console.error(err)
    throw new createError.InternalServerError(err)
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction)
  }

}

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHander())
  .use(validator({
    inputSchema: uploadAuctionPictureSchema
  }))
  .use(cors())