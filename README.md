# Documentation, how to start website

- cd into the github repo directory
- $docker-compose up --build
- $./smtp.sh

-----------

Milestone #1
Description

1. Develop a user-creation system validated with email. Handle duplicate credentials.
   /api/adduser { username, password, email } -- Creates a disabled user that cannot log in.
   GET /api/verify { email, key } -- Verification link (make sure to include the full link with parameters as part of the plain email text) with the two parameters in the query string is sent by email. Do not use a third-party mail service (e.g., gmail) for your mail server. After verifying (or not verifying) the email, redirect the user to the UI.

2. Add cookie-based session support. Ideally, make sessions persist across server restarts.
   /api/login { username, password }
   /api/logout { }
   /api/check-auth -- Verifies if the user is currently logged in, returns { isLoggedIn: boolean, userId: string }
3. GET "/"
   Display a list of videos with their corresponding thumbnails

4. POST /api/videos/ {count}:
   Return list of _count_ video IDs and metadata {title, description}
5. GET /api/manifest/:id
   Send DASH manifest with id :id to the frontend to view the selected video
6. GET /api/thumbnail/:id
   Send thumbnail (the first frame of the video) of video with id :id to the frontend (jpg)
7. GET /play/:id
   Return a frontend video player that can play video with id :id

Similar to wp2, we have

The user should be able to pause div(id="playPauseBtn") and play div(id="playPauseBtn") the video, seek within the video, and dynamically change resolutions.

Resolutions & Bitrates:
320x180 254kbps
320x180 507kbps
480x270 759kbps
640x360 1013kbps
640x360 1254kbps
768x432 1883kbps
1024x576 3134kbps
1280x720 4952kbps

All of the API calls must be to POST routes unless otherwise specified.
Include a 'status' property in all JSON responses with the value 'OK' or 'ERROR'. Use your judgement for possible operations/situations that may lead to an error.

All GET and POST responses must contain the header field X-CSE356 with the value containing the ID copied from the course interface.
If there is any error, you should reply with status code 200 and {"status": "ERROR","error":true,"message":"your error message"}

Videos and metadata can be downloaded using the command: "wget -r -l1 -A "_.mp4" -A "_.json" -nd -P videos http://130.245.136.73/mnt2/video/m1.html"

Note: Port 25, the standard SMTP port, is blocked by default. Please execute the following commands on your VMs that need to send email, and our grading instance will act as a relay:
ip6tables -I OUTPUT -p tcp -m tcp --dport 25 -j DROP
iptables -t nat -I OUTPUT -o ens3 -p tcp -m tcp --dport 25 -j DNAT --to-destination 130.245.136.123:11587
Note that iptables commands are not automatically saved on server restart.
