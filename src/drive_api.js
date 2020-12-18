const fs = require('fs')
// const readline = require('readline')
const { promisify } = require('util')
const { google } = require('googleapis')

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/drive']
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json'

const readFile = promisify(fs.readFile)

async function authenticate () {
  const credentialsContent = await readFile('credentials.json')
  const credentials = JSON.parse(credentialsContent)

  const { client_secret, client_id, redirect_uris } = credentials.installed
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

  const tokenContent = await readFile(TOKEN_PATH)
  const token = JSON.parse(tokenContent)
  oAuth2Client.setCredentials(token)

  return oAuth2Client
}

const getDriveApi = async () => google.drive({ version: 'v3', auth: await authenticate() })
