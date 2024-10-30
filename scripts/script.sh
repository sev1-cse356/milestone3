#!/bin/bash
for file in media/*.mp4; do
  filename=$(basename "$file" .mp4)
  ffmpeg -i "$file" -filter_complex \
    "[0:v]split=8[v1][v2][v3][v4][v5][v6][v7][v8]; \
     [v1]scale=320:180[v1out]; [v2]scale=320:180[v2out]; \
     [v3]scale=480:270[v3out]; [v4]scale=640:360[v4out]; \
     [v5]scale=640:360[v5out]; [v6]scale=768:432[v6out]; \
     [v7]scale=1024:576[v7out]; [v8]scale=1280:720[v8out]" \
    -map "[v1out]" -b:v 254k -init_seg_name "${filename}_init_320x180_254k.mp4" -media_seg_name "${filename}_chunk_320x180_254k_%d.m4s" \
    -map "[v2out]" -b:v 507k -init_seg_name "${filename}_init_320x180_507k.mp4" -media_seg_name "${filename}_chunk_320x180_507k_%d.m4s" \
    -map "[v3out]" -b:v 759k -init_seg_name "${filename}_init_480x270_759k.mp4" -media_seg_name "${filename}_chunk_480x270_759k_%d.m4s" \
    -map "[v4out]" -b:v 1013k -init_seg_name "${filename}_init_640x360_1013k.mp4" -media_seg_name "${filename}_chunk_640x360_1013k_%d.m4s" \
    -map "[v5out]" -b:v 1254k -init_seg_name "${filename}_init_640x360_1254k.mp4" -media_seg_name "${filename}_chunk_640x360_1254k_%d.m4s" \
    -map "[v6out]" -b:v 1883k -init_seg_name "${filename}_init_768x432_1883k.mp4" -media_seg_name "${filename}_chunk_768x432_1883k_%d.m4s" \
    -map "[v7out]" -b:v 3134k -init_seg_name "${filename}_init_1024x576_3134k.mp4" -media_seg_name "${filename}_chunk_1024x576_3134k_%d.m4s" \
    -map "[v8out]" -b:v 4952k -init_seg_name "${filename}_init_1280x720_4952k.mp4" -media_seg_name "${filename}_chunk_1280x720_4952k_%d.m4s" \
    -use_template 1 -use_timeline 1 -seg_duration 10 -adaptation_sets "id=0,streams=v" -f dash "media/${filename}.mpd"
done

