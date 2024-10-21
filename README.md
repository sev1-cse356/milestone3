Warmup Project #2
Description

1. Develop a user-creation system validated with email. Handle duplicate credentials.
/adduser { username, password, email } -- Creates a disabled user that cannot log in.
GET /verify { email, key } -- Verification link (make sure to include the full link with parameters as part of the plain email text) with the two parameters in the query string is sent by email. Do not use a third-party mail service (e.g., gmail) for your mail server.

2. Add cookie-based session support. Ideally, make sessions persist across server restarts.
/login { username, password }
/logout { }

3. When a user is logged in, their root interface should include a media player capable of play MPEG-DASH media.
The user should be able to pause div(id="playPauseBtn") and play div(id="playPauseBtn") the video, seek within the video, and dynamically change resolutions. 

The server should provide a MPEG-DASH manifest which should be accessible via a GET request to "http://your.server.com/media/output.mpd".

Additionally the chunks (10 second segments) should be accessible at "http://your.server.com/media/chunk_${Bandwidth}_${Segment_Number starting from 1}.m4s"

The bandwidth is measured in bit. For example, the fourth segment of a video with bitrate 507k will be "chunk_507000_4.m4s".

Download the mp4 file for this assignment from:
http://130.245.136.73/mnt2/video/4781506-uhd_4096_2160_25fps.mp4

Resolutions & Bitrates:
320x180    254kbps
320x180    507kbps
480x270    759kbps
640x360    1013kbps
640x360    1254kbps
768x432    1883kbps
1024x576   3134kbps
1280x720   4952kbps

All of the API calls must be to POST routes unless otherwise specified.
Include a 'status' property in all JSON responses with the value 'OK' or 'ERROR'. Use your judgement for possible operations/situations that may lead to an error.

All GET and POST responses must contain the header field X-CSE356 with the value containing the ID copied from the course interface.
If there is any error, you should reply with status code 200 and {"status": "ERROR","error":true,"message":"your error message"}

Note: Port 25, the standard SMTP port, is blocked by default. Please execute the following commands on your VMs that need to send email, and our grading instance will act as a relay:
ip6tables -I OUTPUT -p tcp -m tcp --dport 25 -j DROP
iptables -t nat -I OUTPUT -o ens3 -p tcp -m tcp --dport 25 -j DNAT --to-destination 130.245.136.123:11587
Note that iptables commands are not automatically saved on server restart.

----------------------------------------------------------------------------------

Grading completed. Score: 10

Successfully added user: grader+y87gHreFBl = 0.5pts.
/adduser ERRORs out when creating an account with duplicate credentials = 0.5pts.
Successfully verified users grader+y87gHreFBl and grader+gF0L8QihGQ = 0.5pts.
Verifying user grader+gF0L8QihGQ with wrong key errors out = 0.5pt
Recieved correct Header = 0.5pts.
Successfully logged into user grader+y87gHreFBl = 0.5pts.
a chunk found = 0.5pts
Successfully seeked through video = 0.5pts.
played video successfully = 0.5pts.
paused video successfully = 0.5pts.
played video successfully
Fetched DASH manifest. undefined
Parsed DASH manifest.
Extracted video representation.
all representations correct in manifest = 0.5pts.
Successfully downloaded initialization segment OK = 0.5pts.
Successfully downloaded a media segment. OK = 0.5pts.
Student video fragment created.
Extracted frame from student video.
Successfully extracted frame for comparison.
Comparing randomly selected frames
Extracted video representation.
all representations correct in manifest = 0.5pts.
Successfully downloaded initialization segment OK = 0.5pts.
Successfully downloaded a media segment. OK = 0.5pts.
Student video fragment created.
Extracted frame from student video.
Successfully extracted frame for comparison.
Comparing randomly selected frames
All cases passed!
