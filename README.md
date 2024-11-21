# Documentation, how to start website

- cd into the github repo directory
- $docker-compose up --build
- $./smtp.sh

execute the docker container to see the videos </br>
- $ docker exec -it milestone2-express-1 bash

-----------

# Milestone #3 Description

Include everything from the previous two milestones plus the additional 3 functionalities below:

1. Protect the entire site, including all API calls and video URLs, with a TLS/SSL certificate.

2. POST /api/videos {videoId, count} (augments /api/videos from previous milestone)

Return information about videos similar to the video with the specified `${videoId}`. 
Use a collaborative filtering algorithm to identify videos that are similar to the video specified by the videoId. Two videos are considered similar if a similar group of users liked the video. If no id is specified, then fallback to user recommendations like in the previous assignment. 
For an example and to aid in visualization, imagine a row of user_ids and a column of video_ids, and a binary value in each column for either a like or dislike. We can say two videos are similar if their corresponding column vector of the 2d matrix are similar. What similar means is going to be something you have to decide. 
Response format: {videos: [{id: String, description: string, title: string, watched: boolean, liked: boolean|null, likevalues: Number }]}, where videos contain `${count}` number of videos. Watched field = true if the user has watched the video, false otherwise. The liked field should follow the same format as /api/like, true if liked, false if disliked and null otherwise.

3. POST /api/upload { author, title, description, mp4File}
Upload a video to the site with title: title and author: author, description: description and mp4file: is the mp4 file.
Response format: {id: string}

-------------------


-------------

# Notes

- the m1.html is the http://130.245.136.73/mnt2/video/m1.html file that we made scripts to pull the videos from.
