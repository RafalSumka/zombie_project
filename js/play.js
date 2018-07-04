var player;
var enemy;
var humans;
var attackAnimation;
var canAttack = true;

const DEBUG = true;

var playState = {
    preload: function () {
        game.load.spritesheet('zombie', 'assets/sprites/zombie.png', 7, 10, 4);
        game.load.spritesheet('human', 'assets/sprites/human.png', 7, 10, 5);
    },

    create: function () {

        game.stage.backgroundColor = "#70b749";
        game.physics.startSystem(Phaser.Physics.ARCADE);


        // game.world.setBounds(0, 0, 1920, 600);

        //create player
        // var result = this.findObjectsByType('playerStart', map, 'objectsLayer');

        player = game.add.sprite(22, 22, 'zombie');
        game.camera.follow(player);
        game.physics.enable(player, Phaser.Physics.ARCADE);
        player.body.collideWorldBounds = true;
        player.anchor.setTo(.5, .5);
        player.scale.set(8);
        player.animations.add('idle', [0], 1, true);
        player.animations.add('run', [1, 2], 6, true);
        attackAnimation = player.animations.add('attack', [3, 0, 3], 5, false);
        // attackAnimation.onComplete.add(function() {
        //     console.log('tee');
        //    player.frame = 0;
        // }, this);
        player.rotatedToLeft = true;
        player.moving = 0;

        humans = game.add.group();

        for (var i = 0; i < 5; i++)
        {
            var human = game.add.sprite(360 + Math.random() * 200, 120 + Math.random() * 200, 'human');
            humans.add(human);
            game.physics.enable(human, Phaser.Physics.ARCADE);
            human.body.collideWorldBounds = true;
            human.anchor.setTo(.5, .5);
            human.scale.set(8);
            human.animations.add('idle', [0], 2, true);
            human.animations.add('run', [1, 2], 6, true);
            human.animations.add('panic_run', [3, 4], 12, true);
            human.rotatedToLeft = true;
            human.moving = false;
            human.nextMove = 0;
            human.animations.play('idle');
            // randomMove(human);
        }

        // enemy = game.add.sprite(400, 300, 'human');
        // game.physics.enable(enemy, Phaser.Physics.ARCADE);
        // enemy.body.collideWorldBounds = true;
        // enemy.anchor.setTo(.5, .5);
        // enemy.scale.set(8);
        // enemy.animations.add('idle', [0], 2, true);
        // enemy.animations.add('run', [2, 3], 6, true);
        // enemy.rotatedToLeft = true;
        // enemy.moving = 0;
        // enemy.animations.play('idle');

        // game.time.events.loop(3000, function() {
        //     var delay = randomInt(100, 3000);
        //     var x = this.game.world.randomX;
        //     var y = this.game.world.randomY;
        //     var speed = 200;var duration = (Phaser.Point.distance(enemy, {x: x, y: y}) / speed) * 1000;
        //     game.add.tween(enemy).to({x: x, y: y}, duration, null, true, delay);
        //     }, this);
        //
        // game.add.tween(sprite).to({x: 200}, 2000, Phaser.Easing.Quadratic.InOut, true).onComplete.add(function() {
        //     game.time.events.add(1000, function() {
        //
        //         }, this);}, this);
        // enemyMovement();



    },

    update: function () {
        humans.forEach(function(human) {
            if (game.physics.arcade.distanceBetween(player, human) < 200 && !human.moving) {
                human.moving = true;
                randomMove(human, 400, 'panic_run', 1.5);
                var delay = randomInt(1000, 7000);
                human.nextMove = game.time.now + delay;
            }

            if (game.time.now > human.nextMove && !human.moving) {
                human.moving = true;
                var delay = randomInt(1000, 7000);
                human.nextMove = game.time.now + delay;
                randomMove(human, 200, 'run', 1);
            }

        });
        updateMovement();
    },

    render: function () {
        // Sprite debug info
        if (DEBUG) {
            game.debug.spriteInfo(player, 32, 32);
            // game.debug.body(player);
            // humans.forEach(function(human) {
            //     // game.debug.text(game.physics.arcade.distanceBetween(player, human), 32, 150);
            // });
        }
    },
}

function updateMovement() {

    player.body.velocity.x = 0;
    player.body.velocity.y = 0;
    // player.animations.play('idle');
    player.moving = false;

    if (game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
        player.body.velocity.y = -200;
        player.animations.play('run');
        player.moving = true;
    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
        player.body.velocity.y = 200;
        player.animations.play('run');
        player.moving = true;
    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
        if (!player.rotatedToLeft) {
            player.rotatedToLeft = true;
            player.scale.x *= -1;
        }
        player.animations.play('run');
        player.body.velocity.x = -200;
        player.moving = true;

    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
        if (player.rotatedToLeft) {
            player.rotatedToLeft = false;
            player.scale.x *= -1;
        }

        player.body.velocity.x = 200;
        player.animations.play('run');
        player.moving = true;


    }

    if (!player.moving && game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && canAttack) {
        canAttack = false;
        game.time.events.add(200, (function() {
            canAttack = true;
        }), this);

        player.animations.play('attack');
    }

    if (!player.moving && !attackAnimation.isPlaying) {
        player.frame = 0;
    }
}

function randomMove(sprite, offset, animation, speedMultiplier) {
    sprite.animations.play(animation);
        var x = randomWorldX(sprite.x, offset);
        var y = randomWorldY(sprite.y, offset);

        if (x > sprite.x && sprite.rotatedToLeft) {
            sprite.rotatedToLeft = false;
            sprite.scale.x *= -1;
        }

        if (x < sprite.x && !sprite.rotatedToLeft) {
            sprite.rotatedToLeft = true;
            sprite.scale.x *= -1;
        }

        var speed = 200 * speedMultiplier;
        var duration = (Phaser.Point.distance(sprite, {x: x, y: y}) / speed) * 1000;
    game.add.tween(sprite).to({x: x, y: y}, duration, null, true).onComplete.add(function() {
        sprite.animations.stop();
        sprite.frame = 0;
        sprite.moving = false;


        }, this);
}

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function randomWorldX(currentX, offset) {
    var x = randomInt(currentX - offset, currentX + offset);
    if (x > game.world.width || x < 50) {
        return randomWorldX(currentX, offset);
    }

    return x;
}

function randomWorldY(currentY, offset) {
    var y = randomInt(currentY - offset, currentY + offset);
    if (y > game.world.height || y < 50) {
        return randomWorldY(currentY, offset);
    }

    return y;
}