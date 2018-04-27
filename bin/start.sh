#!/bin/bash

cd /ui && httpserver -p 80 &
cd /spotter && npm run start &> /logs/spotter.log
