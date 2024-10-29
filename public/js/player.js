document.addEventListener('DOMContentLoaded', function() {
    var url = 'http://your.server.com/media/output.mpd'; // Adjust to your server's address
    var player = dashjs.MediaPlayer().create();
    var video = document.getElementById('videoPlayer');
    var playPauseBtn = document.getElementById('playPauseBtn');
  
    player.initialize(video, url, false);
  
    // Play/Pause functionality
    playPauseBtn.addEventListener('click', function() {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });
  });