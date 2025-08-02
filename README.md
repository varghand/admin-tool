# Sound Realms Admin Tool

This is a customer support tool for viewing and editing user access.

## Setup

Create `backend/.env`:

    AWS_REGION=eu-north-1
    AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
    AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY

Install backend dependencies:

    cd backend
    npm ci

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
