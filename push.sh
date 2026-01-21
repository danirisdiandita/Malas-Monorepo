#!/bin/bash

# Push to GitHub
DATE=$(date)
MSG="Update $DATE${1:+ : $1}"

git add .
git commit -m "$MSG"
git push origin main