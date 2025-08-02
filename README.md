# Sound Realms Admin Tool

This is a customer support tool for viewing and editing user access.

## Setup

Create `backend/.env`:

    AWS_REGION=eu-north-1
    AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
    AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
    UNLOCKED_CONTENT_TABLE='unlocked-content-table-dev'

Install backend dependencies:

    cd backend
    npm ci

Create `frontend/.env` (values for dev environment):

    REACT_APP_AWS_REGION=eu-north-1
    REACT_APP_USER_POOL_ID=eu-north-1_wScBt5dG1
    REACT_APP_USER_POOL_CLIENT_ID=hsth26nb2c4nubsn9997530vc

Install frontend dependencies:

    cd frontend
    npm ci

## To Run the App

Start Backend:

    cd backend
    node server.js

Start Frontend:

    cd frontend
    npm start

Then go to http://localhost:3000 in your browser.

## Deployment

### One-time setup for deploying backend
Create backend project:

    heroku login
    heroku create sr-admin-backend

Generate AWS IAM credentials
 
    aws iam create-access-key --user-name admin-tool-backend-user

Populate all environment variables (same as content in `.env` file), but remember to use the IAM credentials and not your own. You do this under Settings -> Config Vars on Heroku, or using the CLI.

Create a Heroku API key secret in your GitHub repo:

1. Go to your Heroku account settings → API Key → Copy.
2. In GitHub repo → Settings → Secrets and variables → Actions → New repository secret
3. Name it HEROKU_API_KEY and paste the key.

From now all commits pushed to the master branch will be automatically deployed using the Github Action!

## Debugging

Follow backend logs in real-time:

    heroku logs --tail -a sr-admin-backend
