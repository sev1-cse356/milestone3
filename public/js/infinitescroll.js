document.addEventListener('DOMContentLoaded', function() {
  var videoPlayer = document.getElementById('videoPlayer');
  var url = 'http://your.server.com/media/output.mpd'; // Adjust to your server's address
  var player = dashjs.MediaPlayer().create();
  player.initialize(videoPlayer, url, false);

  // Load the current video
  function loadVideo(videoId) {
    const manifestUrl = `/api/manifest/${videoId}`;
    player.attachSource(manifestUrl);
    // Update the URL without reloading
    history.pushState(null, '', `/play/${videoId}`);
  }

  // Scroll event listener
  window.addEventListener('scroll', ()=> {
    console.log('Scroll event detected.'); //for debugging
    event.preventDefault();

    // Use the global variable
    const currentVideoId = currentVideoId; // Access global variable

    if (event.deltaY < 0) { // Scroll up
      fetch(`/api/videos/prev/${currentVideoId}`)
        .then(response => response.json())
        .then(data => loadVideo(data.prevId))
        .catch(error => console.error('Error fetching previous video:', error));
    } else { // Scroll down
      fetch(`/api/videos/next/${currentVideoId}`)
        .then(response => response.json())
        .then(data => loadVideo(data.nextId))
        .catch(error => console.error('Error fetching next video:', error));
    }
  });
});

