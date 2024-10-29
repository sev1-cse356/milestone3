#!/bin/bash

# Path to the media directory
MEDIA_DIR="./src/media"

# Array of resolutions and bitrates to generate
declare -a BITRATES=("254k" "507k" "759k" "1013k" "1254k" "1883k" "3134k" "4952k")
declare -a RESOLUTIONS=("320x180" "320x180" "480x270" "640x360" "640x360" "768x432" "1024x576" "1280x720")

# Loop through each video file in the media directory
for video in $MEDIA_DIR/*.mp4; do
  filename=$(basename -- "$video")
  name="${filename%.*}"

  echo "Processing $filename..."

  # Generate DASH-compatible segments for each resolution/bitrate
  for i in "${!RESOLUTIONS[@]}"; do
    resolution=${RESOLUTIONS[$i]}
    bitrate=${BITRATES[$i]}

    echo "Generating $resolution at $bitrate for $name..."

    # Resize the video to the specified resolution and create DASH segments
    ffmpeg -i "$video" -vf scale="${resolution}" \
      -b:v "$bitrate" -keyint_min 60 -g 60 -sc_threshold 0 \
      -c:v libx264 -x264-params "keyint=60:min-keyint=60:scenecut=0" \
      -use_timeline 1 -use_template 1 -init_seg_name "${name}_init_${resolution}_${bitrate}.mp4" \
      -media_seg_name "${name}_chunk_${resolution}_${bitrate}_%d.m4s" \
      -f dash "$MEDIA_DIR/${name}_${bitrate}.mpd"
  done

  echo "Finished processing $filename"
done

echo "MPD generation completed!"
