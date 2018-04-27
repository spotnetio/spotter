#!/bin/bash

if [ "${TARG}" = "spotter" ]; then
	echo "npm run start"
    cd /spotter && npm run start
else
	echo "httpserver"
    cd /ui && httpserver
fi