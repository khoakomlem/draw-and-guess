var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var port = process.env.PORT || 3000;
var express = require('express');
app.use(express.static(path.join(__dirname + '/views')));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.post('/error', function(req, res) {
	res.send("http://facebook.com/dangcap2004");
})

//------------------------------------------------------

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;

    while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

const fs = require("fs");
const axios = require('axios');
var roomNumber = 10000000,
    rooms = [],
    games = {},
    words = [
    	'Apple',
        'Avocados',
    	'Banana',
        'Blueberries',
    	'Coconut',
        'Cherries',
        'Mango',
        'Strawberries',
        'Watermelon',
        'Tomato',
        'Ricardo Milos',
        'Songoku',
        'Oranges',
        'Frog',
        'Chiken',
        'Bird',
        'Mirror',
        'Paper',
        'Pencil',
        'Laptop',
        'Computer',
        'Smart phone',
        'Yasuo',
        'Television',
        'Pig',
        'Car',
        'Book',
        'Duck',
        'Pen',
        'Eyeglass',
    	'Garlic',
        'Avocados',
    ];

var findIdRoom_SocketId = function(socketID) {
    for (var i in rooms) {
        for (var j in rooms[i].playing)
            if (rooms[i].playing[j] == socketID)
                return rooms[i].id;
    }

    return -1;
}

io.on('connection', socket => {
    // socket.emit('searching room');

    socket.on('rooms update', () => {
    	console.log('rooms update');
        socket.emit('rooms update', rooms);
    })

    socket.on('mouseDragged', req => {
        let idRoom = findIdRoom_SocketId(socket.id);
        let game = games[idRoom];
        if (!game || game.last_drawman != socket.id)
            return;
        req.id = socket.id;
        io.to(idRoom).emit('mouseDragged', req);
    })

    socket.on('mousePressed', req => {
        let idRoom = findIdRoom_SocketId(socket.id);
        let game = games[idRoom];
        if (!game || game.last_drawman != socket.id)
            return;
        req.id = socket.id;
        io.to(idRoom).emit('mousePressed', req);
    })

    socket.on('room create', data => { // người tạo room gửi

        let { maxPlayer, width, height } = { ...data };

        rooms.push({
            master: socket.id,
            id: roomNumber++,
            text: 'hello',
            maxPlayer: maxPlayer,
            time: Date.now(),
            width: width,
            height: height,
            playing: [socket.id]
        })

        //join room vừa tạo
        socket.join(rooms[rooms.length - 1].id);

        io.emit('room create', rooms[rooms.length - 1]);
    })

    socket.on('room join', idRoom => {
        for (var i in rooms) {
            if (rooms[i].id != idRoom) continue;
            let { master, id, text, maxPlayer, time, width, height, playing } = rooms[i];
            if (playing.length >= maxPlayer) {
                socket.emit('reject', 'Phòng này đã đủ số lượng người chơi!');
                return;
            }

            rooms[i].playing.push(socket.id);
            socket.join(idRoom);
            io.emit('room join', rooms[i]);

            if (games[idRoom]) {
            	games[idRoom].queue_drawman.push(socket.id);

            	if (games[idRoom].state == "wait_5000")
            		io.to(socket.id).emit('room alert', {
            			title: "Thông báo!",
            			icon: "success",
            			text: "Trò chơi sẽ bắt đầu sau vài giây!"
            		});

            	if (games[idRoom].state == "wait_60000")
            		io.to(socket.id).emit('room alert', {
            			title: "Thông báo!",
            			icon: "info",
            			text: "Bạn là khán giả! Hãy chờ lượt này kết thúc"
            		});
            }

            io.to(idRoom).emit('room chat', {
            	id: 'system',
            	time: Date.now(),
            	message: socket.id+ ' đã vào phòng!'
            })

            io.to(idRoom).emit('room join success', { id: socket.id, room: rooms[i] });

            if (rooms[i].playing.length >= 3 && !games[idRoom]) { //bắt đầu game
                io.to(idRoom).emit('game start');

                games[rooms[i].id] = {
                    queue_drawman: shuffle(rooms[i].playing),
                    last_drawman: 'none',
                    index: 0,
                    score: {},
                    state: 'wait_5000', // ['wait_5000', 'wait60000']
                    time: 0,
                    interval: '',
                    guess_word: '',
                    first_guess: true,
                    guessed: []
                }

                let timeInterval = 1000;
                games[rooms[i].id].interval = setInterval(function() {
                    let game = games[rooms[i].id];
                    game.time += timeInterval;

                    if (game.time >= 5000 && game.state == 'wait_5000') { // tại thời điểm mới bắt đầu regame
                    	// game.score = {};
                        game.time = 0;
                        game.first_guess = true;
                        game.last_drawman = game.queue_drawman[game.index];
                        game.guessed = [];
                        io.to(idRoom).emit('game choosedrawman', game.queue_drawman[game.index++]);
                        if (game.index >= game.queue_drawman.length) {
                            game.index = 0;
                            game.queue_drawman = shuffle(game.queue_drawman);
                        }
                        game.guess_word = words[Math.floor(Math.random() * words.length)];

                        io.to(game.last_drawman).emit('game wordtodraw', game.guess_word);

                        game.state = 'wait_60000';
                    }

                    if (game.time >= 60000 && game.state == 'wait_60000') { // tại thời điểm timeup
    					console.log(game.guessed)

                        game.time = 0;

                        if (game.guessed.length > 0){
                        	let score = game.queue_drawman.length - game.guessed.length;
                        	if (!game.score[game.last_drawman])
                        		game.score[game.last_drawman] = 0;
                        	game.score[game.last_drawman] += score;
                        	io.to(game.last_drawman).emit('room chat', {
                        		id: 'system',
                        		time: Date.now(),
                        		message: 'Số người đoán được là ' + game.guessed.length +' nên bạn được cộng ' + score + ' điểm!'
                        	})
                        }

                        io.to(idRoom).emit('game timeup');

                        io.to(idRoom).emit('room chat', {
                        	id: 'system',
                        	time: Date.now(),
                        	message: 'Số điểm hiện tại mỗi người chơi: '
                        })

                        for (let i in game.score) {
                        	io.to(idRoom).emit('room chat', {
                        		id: 'system',
                        		time: Date.now(),
                        		message: i+': '+game.score[i]+' điểm'
                        	})
                        }

                        setTimeout(()=>{
                        	io.to(idRoom).emit('room chat', {
                        		id: 'system',
                        		time: Date.now(),
                        		message: 'The word you are guessing is: ' + game.guess_word.toUpperCase()
                        	})
                        }, 100);


                        game.state = 'wait_5000';
                    }
                }, timeInterval);
            }
        	break;
        }
    })

    socket.on('disconnect', () => {
        //tự leave room (io.sockets.rooms)
        let idRoom = findIdRoom_SocketId(socket.id),
            i, playing;
        if (idRoom == -1) return;

        for (i in rooms) {
            if (rooms[i].id == idRoom) {
                playing = rooms[i].playing;
                playing.splice(playing.indexOf(socket.id), 1); // xóa bỏ người chơi trong room đó
                break;
            }
        }

        io.to(rooms[i].id).emit('room leave', socket.id); // thông báo người thoát

        io.to(idRoom).emit('room chat', { // thông báo vào chat
        	id: 'system',
        	time: Date.now(),
        	message: socket.id+ ' đã thoát game!'
        })

        io.emit('room join', rooms[i]); // mượn event room join chỉ để update bảng room

        let game = games[idRoom];
        if (game) {
        	let queue_drawman = game.queue_drawman;
        	queue_drawman.splice(queue_drawman.indexOf(socket.id), 1); // xóa bỏ người chơi trong mảng queue_drawman

        	if (playing.length < 3) {
        	    io.to(idRoom).emit('game destroy'); // hủy bỏ game nếu players amount < 3
        	    io.emit('room delete', rooms[i].id); // update xóa room
        	    clearInterval(game.interval);
        	    delete game; // xóa game
        	    rooms.splice(i, 1); 
        	}
        } else {
        	if (playing.length <=0) {
        		io.emit('room delete', rooms[i].id); // update xóa room
        		rooms.splice(i, 1); 
        	}
        }
    })

    socket.on('room chat', message=>{
    	let idRoom = findIdRoom_SocketId(socket.id);
    	let game = games[idRoom];
    	if (game) { // đoán

    		if (game.last_drawman==socket.id){
    			io.to(socket.id).emit('room chat', {
    				id: 'system',
    				time: Date.now(),
    				message: 'Bạn không thể chat khi đang làm người vẽ!'
    			})
    			return;
    		}

    		if (games[idRoom].state == 'wait_60000' && message.toUpperCase() == game.guess_word.toUpperCase()) {
    			if (!game.score[socket.id]) 
    				game.score[socket.id] = 0;

    			if (game.guessed.indexOf(socket.id) != -1){
    				io.to(socket.id).emit('room chat', {
    					id: 'system',
    					time: Date.now(),
    					message: 'Bạn đã đoán nó rồi -_-'
    				})
    				return;
    			}

    			game.guessed.push(socket.id);

    			if (game.first_guess) {
    				game.score[socket.id] += 2;

    				io.to(idRoom).emit('room chat', [
    					Date.now(),
    					socket.id,
    					'Chúc mừng, bạn là người đầu tiên đoán đúng từ!!! (+2)',
    					socket.id+' đã đoán đúng đầu tiên!',
    				]);
    			} else {
    				game.score[socket.id] ++;
    				io.to(idRoom).emit('room chat', [
    					Date.now(),
    					socket.id,
    					'Chúc mừng, bạn đã đoán đúng từ!!! (+1)',
    					socket.id+' đã đoán đúng từ!'
    				]);
    			}

    			setTimeout(()=>{
    				io.to(socket.id).emit('room chat', {
    					id: '[Hệ thống]',
    					time: Date.now(),
    					message: "Số điểm hiện tại của bạn: " + game.score[socket.id]
    				});
    			}, 100);
    			
    			game.first_guess = false;
    			return;
    		}
    	}

    	io.to(idRoom).emit('room chat', {
    		id: socket.id,
    		time: Date.now(),
    		message: message
    	});
    })
})

http.listen(port, function() {
    console.log('listening on *:' + port);
});
