# Architecture

## Deployment

All commits pushed to the master branch will be deployed automatically to both frontend and backend. There were some manual steps carried out initially, which is documented here. 

### One-time setup for deploying backend
Create backend project:

    heroku login
    heroku create sr-admin-backend

Generate AWS IAM credentials
 
    aws iam create-access-key --user-name admin-tool-backend-prod

Populate all environment variables (same as content in `.env` file), but remember to use the IAM credentials and not your own. You do this under Settings -> Config Vars on Heroku, or using the CLI.

Create a Heroku API key secret in your GitHub repo:

1. Go to your Heroku account settings → API Key → Copy.
2. In GitHub repo → Settings → Secrets and variables → Actions → New repository secret
3. Name it HEROKU_API_KEY and paste the key.

### One-time setup for deploying frontend
1. Go to https://app.netlify.com/
2. Click “Add new site” > “Import from Git”
3. Select your repo and the `frontend` directory
4. Populate environment variables
