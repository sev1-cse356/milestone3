#!/bin/bash

home=$PWD
cd src/media/
# Navigate to the media directory

# Loop through all .mp4 files and generate MPD files
for video in *.mp4; do
  # Get the filename without extension
  filename="${video%.*}"
  
  # Use MP4Box to generate MPEG-DASH compatible .mpd file
  echo "Processing $video..."
  
  MP4Box -dash 4000 -rap -frag-rap -profile dashavc264:onDemand -out "$filename.mpd" "$video"
done

echo "MPD generation completed!"
cd $home