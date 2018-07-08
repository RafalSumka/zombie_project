/** -- CONSTS DECLARATIONS -- */
const DEBUG = true;
const GAME_SCALE = 6;
const HUMANS_NUMBER = 10;
const PLAYER_SPEED = 200;

/** -- VARIABLES DECLARATIONS -- */
var player;
var humans;
var attackAnimation;
var canAttack = true;
var humanSprites = ['human', 'human2', 'human3', 'human5', 'human6'];
var map;
var score = 0;
var scoreText;

/** -- PLAY STATE -- */
var playState = {
    preload: function () {
        //spritesheets
        game.load.spritesheet('zombie', 'assets/sprites/zombie.png', 7, 10, 4);
        game.load.spritesheet('human', 'assets/sprites/human.png', 7, 10, 13);
        game.load.spritesheet('human2', 'assets/sprites/human2.png', 7, 10, 13);
        game.load.spritesheet('human3', 'assets/sprites/human3.png', 7, 10, 13);
        game.load.spritesheet('human5', 'assets/sprites/human5.png', 7, 10, 13);
        game.load.spritesheet('human6', 'assets/sprites/human6.png', 7, 10, 13);


        //tilemaps
        game.load.tilemap('office', 'assets/tilemaps/office.json', null, Phaser.Tilemap.TILED_JSON);

        //images
        game.load.image('officeTiles', 'assets/tiles/office.png');
    },

    create: function () {
        setMap();
        game.physics.startSystem(Phaser.Physics.ARCADE);

        createPlayer();
        createNPCs();
        createScoreText();
        game.camera.follow(player, Phaser.Camera.FOLLOW_LOCKON, 0.05, 0.05);
    },

    update: function () {
        //checks player collisons with walls and objects
        game.physics.arcade.collide(player, game.blockedLayer);

        //handles player attack
        game.physics.arcade.overlap(player, humans, playerOverlapWithHumans, null, this);

        updateScore();
        updateNPCsMovement();
        updatePlayer();
    },

    render: function () {
        if (DEBUG) {
            game.debug.spriteInfo(player, 32, 32);
        }
    }
};


/** -- GAME EXTRA FUNCTIONS -- */

function updateScore() {
    scoreText.text = score + " / " + HUMANS_NUMBER + " Zombies";

    if (score === HUMANS_NUMBER) {
        game.add.text((window.innerWidth * window.devicePixelRatio) / 2, (window.innerHeight * window.devicePixelRatio) / 2, "LEVEL COMPLETED", {
            font: "80px Arial",
            fill: "#000",
            align: "center"
        });
    }
}

function playerOverlapWithHumans(player, human) {
    if (attackAnimation.isPlaying && !human.isZombie && !player.locked) {
        if (human.currentTween) {
            human.currentTween.stop();
        }

        human.moving = false;
        human.nextMove = game.time.now + 5000;
        human.isZombie = true;
        human.body.moves = false;
        human.locked = true;
        player.locked = true;

        human.animations.play('zombie_change').onComplete.add(function () {
            score++;
            player.locked = false;
            human.locked = false;
        });
    }
}

function updatePlayer() {
    player.body.velocity.x = 0;
    player.body.velocity.y = 0;

    player.moving = false;

    if (player.locked) {
        return;
    }

    //update movement
    if (game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
        player.body.velocity.y = -PLAYER_SPEED;
        player.animations.play('run');
        player.moving = true;
    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
        player.body.velocity.y = PLAYER_SPEED;
        player.animations.play('run');
        player.moving = true;
    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
        if (!player.rotatedToLeft) {
            player.rotatedToLeft = true;
            player.scale.x *= -1;
        }
        player.animations.play('run');
        player.body.velocity.x = -PLAYER_SPEED;
        player.moving = true;

    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
        if (player.rotatedToLeft) {
            player.rotatedToLeft = false;
            player.scale.x *= -1;
        }
        player.body.velocity.x = PLAYER_SPEED;
        player.animations.play('run');
        player.moving = true;


    }

    //updates attack
    if (!player.moving && game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && canAttack) {
        canAttack = false;
        game.time.events.add(200, (function () {
            canAttack = true;
        }), this);

        player.animations.play('attack');
    }


    if (!player.moving && !attackAnimation.isPlaying) {
        player.frame = 0;
    }
}

function randomNPCMove(sprite, offset, animation, speedMultiplier) {
    sprite.animations.play(animation);
    var x = randomWorldX(sprite.x, offset);
    var y = randomWorldY(sprite.y, offset);

    //finds another path if previous generated one was in blocked area
    //@todo: but NPC can still run through blocked areas..
    var tile = map.getTileWorldXY(x, y, 8 * GAME_SCALE, 8 * GAME_SCALE, game.blockedLayer, false);
    if (tile !== null) {
        return randomNPCMove(sprite, offset, animation, speedMultiplier);
    }

    if (x > sprite.x && sprite.rotatedToLeft) {
        sprite.rotatedToLeft = false;
        sprite.scale.x *= -1;
    }

    if (x < sprite.x && !sprite.rotatedToLeft) {
        sprite.rotatedToLeft = true;
        sprite.scale.x *= -1;
    }


    //calculates duration
    var speed = 200 * speedMultiplier;
    var duration = (Phaser.Point.distance(sprite, {x: x, y: y}) / speed) * 1000;


    //moves sprite by tween, does not allow to move locked sprites
    sprite.currentTween = game.add.tween(sprite).to({x: x, y: y}, duration, null, true);
    sprite.currentTween.onComplete.add(function () {
        if (!sprite.locked) {
            sprite.animations.stop();
            if (!sprite.isZombie) {
                sprite.frame = 0;
            } else {
                sprite.frame = 10;
            }
        }
        sprite.moving = false;


    }, this);
}

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

//generates random world X within offset
function randomWorldX(currentX, offset) {
    var x = randomInt(currentX - offset, currentX + offset);
    if (x > game.world.width || x < 50) {
        return randomWorldX(currentX, offset);
    }

    return x;
}

//generate random world Y within offset
function randomWorldY(currentY, offset) {
    var y = randomInt(currentY - offset, currentY + offset);
    if (y > game.world.height || y < 50) {
        return randomWorldY(currentY, offset);
    }

    return y;
}

//map settings
function setMap() {
    map = game.add.tilemap('office');

    //the first parameter is the tileset name as specified in Tiled, the second is the key to the asset
    map.addTilesetImage('office', 'officeTiles');

    //create layers
    game.backgroundlayer = map.createLayer('Background');
    game.wallslayer = map.createLayer('Walls');
    game.objectslayer = map.createLayer('Objects');
    game.blockedLayer = map.createLayer('Blocked Layer');

    //set scales to layers
    game.backgroundlayer.setScale(GAME_SCALE);
    game.wallslayer.setScale(GAME_SCALE);
    game.objectslayer.setScale(GAME_SCALE);
    game.blockedLayer.setScale(GAME_SCALE);

    //hide collision blocked layer
    game.blockedLayer.visible = false;

    //set collision layer
    map.setCollisionByExclusion([], true, 'Blocked Layer');

    //resizes the game world to match the layer dimensions
    game.backgroundlayer.resizeWorld();

    //set background color
    game.stage.backgroundColor = "#53565a";
}

//player set up
function createPlayer() {
    //sprite
    player = game.add.sprite(500, game.world.height / 2 - 200, 'zombie');

    //physics
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.collideWorldBounds = true;
    player.anchor.setTo(.5, .5);
    player.scale.set(GAME_SCALE);

    //animations
    player.animations.add('idle', [0], 1, true);
    player.animations.add('run', [1, 2], 6, true);
    attackAnimation = player.animations.add('attack', [0, 3], 5, false);

    //customs properties
    player.rotatedToLeft = true;
    player.moving = false;
    player.locked = false;
}

//npcs set up
function createNPCs() {
    humans = game.add.group();

    for (var i = 0; i < HUMANS_NUMBER; i++) {
        //get random human sprite
        var sprite = humanSprites[Math.floor(Math.random() * humanSprites.length)];

        //sprite
        var human = game.add.sprite(game.world.width - 800 + Math.random() * 200, game.world.height / 2 - 100 + Math.random() * 200, sprite);

        //add to group
        humans.add(human);

        //physics
        game.physics.enable(human, Phaser.Physics.ARCADE);
        human.body.collideWorldBounds = true;
        human.anchor.setTo(.5, .5);
        human.scale.set(GAME_SCALE);

        //animations
        human.animations.add('idle', [0], 2, true);
        human.animations.add('run', [1, 2], 6, true);
        human.animations.add('panic_run', [3, 4], 12, true);
        human.animations.add('zombie_change', [5, 6, 7, 8, 9, 10], 2, false);
        human.animations.add('zombie_run', [11, 12], 6, true);

        //custom properties
        human.rotatedToLeft = true;
        human.moving = false;
        human.currentTween = false;
        human.nextMove = 0;
        human.locked = false;
        human.isZombie = false;

        human.animations.play('idle');
    }
}

//handles score
function createScoreText() {
    scoreText = game.add.text(window.innerWidth * window.devicePixelRatio - 300, 32, "0 / " + HUMANS_NUMBER + " Zombies", {
        font: "32px Arial",
        fill: "#ffffff",
        align: "center"
    });
    scoreText.fixedToCamera = true;
}

function updateNPCsMovement() {
    humans.forEach(function (human) {

        //run away from player
        if (game.physics.arcade.distanceBetween(player, human) < 200 && !human.moving && !human.locked && !human.isZombie) {
            human.moving = true;
            randomNPCMove(human, 200, 'panic_run', 1.5);
            human.nextMove = calculateNextMoveTime();
        }

        //random NPC move
        if (game.time.now > human.nextMove && !human.moving && !human.locked) {
            human.moving = true;
            human.nextMove = calculateNextMoveTime();
            if (!human.isZombie) {
                randomNPCMove(human, 100, 'run', 1);
            } else {
                randomNPCMove(human, 100, 'zombie_run', 0.5);
            }
        }

        //locks player if npc is changing into zombie
        //@todo: probably this code shouldnt be here
        if (human.animations.currentAnim.name === 'zombie_change' && human.animations.currentAnim.isPlaying) {
            player.animations.play('attack');
            player.locked = true;
        }

    });
}

function calculateNextMoveTime() {
    var delay = randomInt(1000, 10000);
    return game.time.now + delay;
}