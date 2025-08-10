# Sound Realms Admin Tool

This is a customer support tool for viewing and editing user access.

## Setup

Create `backend/.env` (values for dev environment):

    AWS_REGION=eu-north-1
    AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
    AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
    UNLOCKED_CONTENT_TABLE='unlocked-content-table-dev'
    USER_POOL_ID=eu-north-1_wScBt5dG1

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

Start Backend with hot reloading:

    cd backend
    npm run dev

Start Frontend:

    cd frontend
    npm start

Then go to http://localhost:3000 in your browser.

## Deployment

All commits pushed to the master branch will be deployed automatically to both frontend and backend (see `.github/workflows/deploy.yml`).

Some AWS resources are deployed with the command `./infrastructure/deploy-prod.sh`.

There were some manual steps carried out initially, which is documented in ./ARCHITECTURE.md. 

## Debugging

Follow backend logs in real-time:

    heroku logs --tail -a sr-admin-backend
