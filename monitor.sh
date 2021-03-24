#!/bin/sh

USER="USER"
SERVER="SERVER"
SSH_KEY="SSH_KEY"

ssh -i $SSH_KEY $USER@$SERVER "ps -ef | grep node"
