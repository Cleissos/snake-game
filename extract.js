const gifFrames = require('gif-frames');
const fs = require('fs');

const gifs = [
  'snake_down.gif',
  'snake_left.gif',
  'snake_right.gif',
  'snake_up.gif'
];

gifs.forEach((gifName) => {

  const outputFolder = gifName.replace('.gif', '');

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
  }

  gifFrames({
    url: `assets/${gifName}`, // <- está dentro da pasta assets
    frames: 'all',
    outputType: 'png'
  }).then(function (frameData) {

    frameData.forEach(function (frame) {
      frame.getImage().pipe(
        fs.createWriteStream(`${outputFolder}/frame_${frame.frameIndex}.png`)
      );
    });

    console.log(`Frames extraídos de ${gifName}`);
  });

});

