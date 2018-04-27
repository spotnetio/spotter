#!/bin/bash

cd /ui && sudo httpserver -p 80 &
cd /spotter && npm run start &> /logs/spotter.log
