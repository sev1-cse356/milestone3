#!/bin/bash
home=$PWD
cd src/media/

# Loop over all .mp4 files in the current directory
for video in *.mp4; do
  # Extract filename without extension
  filename="${video%.*}"
  
  # Run the ffmpeg command to resize and pad the video
  ffmpeg -y -i "$video" \
  -vf "scale=w=iw*min(1280/iw\,720/ih):h=ih*min(1280/iw\,720/ih),pad=1280:720:(1280-iw*min(1280/iw\,720/ih))/2:(720-ih*min(1280/iw\,720/ih))/2" \
  -c:a copy \
  "${filename_padded}.mp4"
done

cd $home