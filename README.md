# Documentation, how to start website

- cd into the github repo directory
- $docker-compose up --build
- $./smtp.sh

- $ docker exec -it milestone2-express-1 bash

-----------

# Milestone #2 Description

1. Include all milestone 1 functionality and include the ones below

2. POST /api/like {id, value}
Allow a logged in user to “like” a post specified by id. value = true if thumbs up, value = false if thumbs down and null if the user did not “like” or “dislike” the video.
Response format: {likes: number} which is the number of likes on the post. This api should return an error if the new “value” is the same as was already previously set.

3. POST /api/videos {count}
Return information about videos that should be recommended to the user based on their previous like/dislike selections.
Use a collaborative filtering algorithm to identify videos that are likely to be liked by the logged in user by identifying other users that have similar like/dislike profiles and recommending videos that were liked by the other similar users.  If there are videos that should be recommended that have not been previously watched by the logged in user, they should be recommended.  If there are no videos that can be identified for recommendation based on collaborative filtering that have not yet been viewed by the logged in user, return random videos, first preferring those that have not been watched previously, and only falling back on random videos that have been watched previously.  
For an example of collaborative filtering, if videos with “id” 1 and 2 were “liked” by user A, and video with “id” 2 was “liked” by user B, then the system should recommend video “id” 1 to user B because users A and B have similar preferences, and user B is likely to enjoy video 1 because the user liked video 2.
Response format: {videos: [{id: String, description: string, title: string, watched: boolean, likevalue: boolean|null }]}, where videos contain ${count} number of videos.

4. POST /api/upload { author, title, video }
Upload a video to the site with title: title and author: author and video: is the mp4 file.
Response format: {id: string}

5. POST /api/view { id }
Mark video “id” as viewed by the logged in user.  This API call should be made by the UI on videos that were not previously watched whenever that video is first “played” for the user.

6. GET /upload
Expects an HTML page where videos can be uploaded from

7. GET /api/processing-status
Returns a list of uploaded videos for the logged in user.
Response format: { videos: [{ id: string, title: string, status: string }] }
where status can be "processing" or "complete", where “processing” indicates the file has been received, but not yet available for viewing.

8. All GET and POST responses must contain the header field X-CSE356 with the value containing the ID copied from the course interface.
If there is any error, you should reply with status code 200 and {"status": "ERROR","error":true,"message":"your error message"}, else respond with status code 200 and the response specified above.


-------------------


-------------

# Notes

- the m1.html is the http://130.245.136.73/mnt2/video/m1.html file that we made scripts to pull the videos from.
