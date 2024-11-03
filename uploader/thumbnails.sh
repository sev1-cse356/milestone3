#!/bin/bash


video="$1"
filename=$(basename -- "$video")
filename="${filename%.*}"
outdir="../../src/media"
# Generate a thumbnail for each video
ffmpeg -y -i "$video" -vf "scale=320:180" -frames:v 1 -q:v 2 "${outdir}/${filename}.jpg"
