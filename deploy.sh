#!/bin/sh

USER="USER"
SERVER="SERVER"
SSH_KEY="SSH_KEY"

rm -f backend.tar
rm -f backend.tar.gz
rm -rf backend/angular
rm -rf backend/images
ng build --prod
tar cvf backend.tar backend && gzip backend.tar

scp -i $SSH_KEY backend.tar.gz $USER@$SERVER:~/
scp -i $SSH_KEY deploy_start.sh $USER@$SERVER:~/
ssh -i $SSH_KEY $USER@$SERVER "~/deploy_start.sh &"
