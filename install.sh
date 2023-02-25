#!/bin/bash
# Script to be executed just once, when the system is installed.
# Commands are only run once even if the script is called multiple times.
cd /app/entities-lib
npm install
cd /app/config-lib
npm install
cd /app/ProductsService
npm install
npm start 
