const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const { path: ffmpegPath } = require('@ffmpeg-installer/ffmpeg');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Helper function to convert time string (HH:MM:SS) to seconds
const timeToSeconds = (time) => {
  const parts = time.split(':');
  return (+parts[0] * 3600) + (+parts[1] * 60) + (+parts[2]);
};

app.post('/convert', upload.single('video'), (req, res) => {
  const { start, end } = req.body;
  const inputPath = req.file.path;
  const outputPath = path.join(__dirname, 'output.gif');

  const startTimeInSeconds = timeToSeconds(start);
  const endTimeInSeconds = timeToSeconds(end);
  const duration = endTimeInSeconds - startTimeInSeconds;

  ffmpeg(inputPath)
    .setStartTime(startTimeInSeconds)
    .duration(duration)
    .outputOptions([
      '-vf', 'fps=10,scale=320:-1:flags=lanczos',
      '-c:v', 'gif'
    ])
    .on('end', function() {
      res.download(outputPath, () => {
        // Optionally, clean up files here
      });
    })
    .on('error', function(err) {
      console.error('Error: ' + err.message);
      res.status(500).send('An error occurred during the conversion process.');
    })
    .save(outputPath);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
