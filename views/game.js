let size = 10, disableDraw=false;

function addMessage(data){
	clearTimeout(timeout);
	$('#talk').html('<p>'+data+'</p>');
	timeout=setTimeout(function(){
		$('#talk p').fadeOut();
	},3000);
}

function mouseWheel(event) {
	size += -event.delta/25;
	if (size < 10) {
		size = 10;
	}
	if (size > 100)
		size = 100;
}

function sizeOf(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function preload() {

	noLoop();

	socket.on('mouseDragged', res=>{
		sketch.strokeWeight(res.size);
		sketch.stroke(255, 204, 0);
		sketch.line(res.mouseX, res.mouseY, res.pmouseX, res.pmouseY);
	})

	socket.on('mousePressed', res=>{
		sketch.strokeWeight(res.size);
		sketch.stroke(255, 204, 0);
		sketch.line(res.mouseX, res.mouseY, res.mouseX, res.mouseY);
	})

	socket.on('game timeup', ()=>{
		changeTitle('Time is up!', true);
	})

	socket.on('game start', ()=>{
		for (let i = 0; i<=4; i++) {
			setTimeout(()=>changeTitle(5-i, i==4), 1000*i);
		}
	})

	socket.on('game choosedrawman', id=>{
		if (id != socket.id) {
			sketch.background(0);
			swal.fire({
				icon: 'info',
				title: 'Bạn là người đoán',
				text: 'Hãy cố gắng hết sức để đoán được đối phương đang vẽ gì!!'
			})
		}
	})

	socket.on('game wordtodraw', word=>{
			sketch.background(0);
			disableDraw = true;
			swal.fire({
				icon: 'info',
				title: 'Bạn là người vẽ',
				text: 'Hãy cố gắng hết sức sao cho bức vẽ của bạn thật khó đoán!!'
			}).then(()=>{
				swal.fire({
					icon: 'info',
					title: 'Lưu ý!',
					text: 'Chủ đề của bức vẽ là: ' + word
				}).then(()=>{
					$('#t').html('Chủ đề: ' + word);
					disableDraw = false;
				})
			})
	})

	socket.on('game destroy', ()=>{
		swal.fire({
			icon: 'error',
			title: 'Oops. . .',
			text: 'Phòng không đủ số lượng người chơi để duy trì game!'
		}).then(()=>{
			hideSketch();
		});
	})
}

function setup() {
	var canv = createCanvas(640, 480);
	canv.parent('canvas');
	sketch = createGraphics(width, height);
	frameRate(100);
}

function mousePressed() {
	if (disableDraw) return;
	socket.emit('mousePressed', {
		mouseX: mouseX,
		mouseY: mouseY,
		size: size
	});
}

function mouseDragged() {
	if (disableDraw) return;
	// sketch.strokeWeight(size);
	// sketch.stroke(255, 204, 0);
	// sketch.line(mouseX, mouseY, pmouseX, pmouseY);

	socket.emit('mouseDragged', {
		mouseX: mouseX,
		mouseY: mouseY,
		pmouseX: pmouseX,
		pmouseY: pmouseY,
		size: size
	});
}

function draw() {
	background(0);
	image(sketch, 0, 0);
	strokeWeight(size);
	stroke(255, 204, 0);
	line(mouseX, mouseY, pmouseX, pmouseY);
	// background(0);
	
}