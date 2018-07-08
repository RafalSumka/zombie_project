var game = new Phaser.Game(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, Phaser.CANVAS, 'game', this, false, false);

game.state.add('play', playState);

game.state.start('play');