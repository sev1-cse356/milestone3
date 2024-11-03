#!/bin/bash

#TODO:
video="$1"
# Extract filename without extension
filename="${video%.*}"

# Run the ffmpeg command to resize and pad the video
ffmpeg -y -i "$video" \
-vf "scale=w=iw*min(1280/iw\,720/ih):h=ih*min(1280/iw\,720/ih),pad=1280:720:(1280-iw*min(1280/iw\,720/ih))/2:(720-ih*min(1280/iw\,720/ih))/2" \
-c:a copy \
"${filenamed}_padded.mp4"
