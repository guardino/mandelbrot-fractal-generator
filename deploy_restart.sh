#!/bin/sh

cd ~/backend
export PATH=~/apps/node-v14.15.1-linux-armv6l/bin:$PATH
MONGO_ATLAS_PW=kbGRjDotp9D6mHN3 JWT_KEY=secret_this_should_be_longer node server.js &
