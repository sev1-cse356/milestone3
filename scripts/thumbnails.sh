#!/bin/bash

cd ./src/media/

# Loop through all .mp4 files in the current directory
for video in *.mp4; do
  # Extract filename without extension
  filename="${video%.*}"
  
  # Generate a thumbnail for each video
  ffmpeg -y -i "$video" -vf "scale=320:180" -frames:v 1 -q:v 2 "${filename}.jpg"
done
