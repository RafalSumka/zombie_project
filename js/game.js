var game = new Phaser.Game(1500, 800, Phaser.CANVAS, 'game', this, false, false);

game.state.add('play', playState);

game.state.start('play');