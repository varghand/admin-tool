#!/bin/bash

aws cloudformation deploy\
  --template-file ./dynamodb_cf_template.yml\
  --stack-name "admin-tool-prod"\
  --parameter-overrides Stage=prod UserPoolId=eu-north-1_pZ63tejOu \
  --capabilities CAPABILITY_NAMED_IAM
