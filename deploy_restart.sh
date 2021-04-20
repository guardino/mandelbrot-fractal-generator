#!/bin/sh

cd ~/backend
export PATH=~/apps/node-v14.15.1-linux-armv6l/bin:$PATH
MONGO_ATLAS_PW=MONGO_ATLAS_PW JWT_KEY=JWT_KEY node server.js &
