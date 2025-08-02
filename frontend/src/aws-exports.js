const awsConfig = {
  Auth: {
    Cognito: {
      //region: process.env.REACT_APP_AWS_REGION,
      userPoolId: process.env.REACT_APP_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
      //mandatorySignIn: true,
    },
  },
};

export default awsConfig;
