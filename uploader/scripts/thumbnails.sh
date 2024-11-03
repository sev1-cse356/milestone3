#!/bin/bash


#TODO:
video=
filename="${video%.*}"

# Generate a thumbnail for each video
ffmpeg -y -i "$video" -vf "scale=320:180" -frames:v 1 -q:v 2 "${filename}.jpg"
