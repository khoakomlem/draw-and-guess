(function($) {
    "use strict";
    $('.column100').on('mouseover', function() {
        var table1 = $(this).parent().parent().parent();
        var table2 = $(this).parent().parent();
        var verTable = $(table1).data('vertable') + "";
        var column = $(this).data('column') + "";

        $(table2).find("." + column).addClass('hov-column-' + verTable);
        $(table1).find(".row100.head ." + column).addClass('hov-column-head-' + verTable);
    });

    $('.column100').on('mouseout', function() {
        var table1 = $(this).parent().parent().parent();
        var table2 = $(this).parent().parent();
        var verTable = $(table1).data('vertable') + "";
        var column = $(this).data('column') + "";

        $(table2).find("." + column).removeClass('hov-column-' + verTable);
        $(table1).find(".row100.head ." + column).removeClass('hov-column-head-' + verTable);
    });


})(jQuery);

$(document).ready(function() {

    var Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        onOpen: toast => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
        }
    });

    showSketch = function() {
        $('#menu').stop().slideUp(1000, () => {
            $('body').css('overflow', 'hidden');

            changeTitle('Đang chờ người chơi . . .', false);
            
            $('#wrap-game').stop().slideDown();
            loop();
        });
    }

    hideSketch = function() {
        $('body').css('overflow', '');
        $('#game h2').html('');
        noLoop();

        $('#wrap-game').stop().slideUp(() => {
            $('#menu').slideDown(500);
        });
    }

    addMessage = function(id, time, message) {
        let c = new Date(time);
        let text = '[' + c.getHours() + ':' + c.getMinutes() + '] ' + id + ': ' + message + '<br>';
        let ele = $('.scrollable');
        if (ele.scrollTop() + ele.height() == ele[0].scrollHeight) {
            $('#chat').append(text);
            ele.scrollTop(ele[0].scrollHeight);
        } else {
            $('#chat').append(text);
        }
    }

    updateRoom = function(master, id, text, maxPlayer, time, width, height, playing) {
        let thaotac = playing.length >= maxPlayer ? 'style="color: red; cursor:no-drop">Fulled' : 'style = "color: green; cursor:pointer" onclick = "socket.emit(`room join`, `' + id + '`);">Vào!!';
        let c = new Date(time);
        let datetime = c.getDate() + '/' + c.getMonth() + ' ' + c.getHours() + ':' + c.getMinutes();
        $('#' + id).html('<td class="column100 column1" data-column="column1" >' + master + '</td><td class="column100 column2" data-column="column2">' + id + '</td><td class="column100 column3" data-column="column3">' + text + '</td><td class="column100 column4" data-column="column4">' + playing.length + '/' + maxPlayer + '</td><td class="column100 column5" data-column="column5">' + datetime + '</td><td class="column100 column6 noselect" data-column="column6"' + thaotac + '</td>');
    }

    addRoom = function(master, id, text, maxPlayer, time, width, height, playing) {
        let thaotac = playing.length >= maxPlayer ? 'style="color: red; cursor:no-drop">Fulled' : 'style = "color: green; cursor:pointer" onclick = "socket.emit(`room join`, `' + id + '`);">Vào!!';
        let c = new Date(time);
        let datetime = c.getDate() + '/' + c.getMonth() + ' ' + c.getHours() + ':' + c.getMinutes();
        $('#ban > tbody').append('<tr id="' + id + '" class="row100"><td class="column100 column1" data-column="column1" >' + master + '</td><td class="column100 column2" data-column="column2">' + id + '</td><td class="column100 column3" data-column="column3">' + text + '</td><td class="column100 column4" data-column="column4">' + playing.length + '/' + maxPlayer + '</td><td class="column100 column5" data-column="column5">' + datetime + '</td><td class="column100 column6 noselect" data-column="column6"' + thaotac + '</td></tr>');
    }

    changeTitle = function(text, willClose){
    	$('#t').stop().fadeOut(()=>{
    		$('#t').html(text);
    		$('#t').stop().fadeIn();
    		if (willClose)
    			setTimeout(()=>changeTitle('', false));
    	})
    }

    socket.on('reject', text => {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: text
        });
    })

    socket.on('room alert', data=>{
    	swal.fire(data);
    })

    socket.on('room chat', data => {
    	if (Array.isArray(data)) {
    		// alert(1)
    		if (data[1] == socket.id)
    			addMessage('[Hệ thống]', data[0], data[2]);
    		else
    			addMessage('[Hệ thống]', data[0], data[3]);
    		return;
    	}

    	let { id, time, message } = data;
        addMessage(id, time, message);

    })

    socket.on('room create', ({ master, id, text, maxPlayer, time, width, height, playing } = { ...data }) => {
        addRoom(master, id, text, maxPlayer, time, width, height, playing);
    })

    socket.on('room join', ({ master, id, text, maxPlayer, time, width, height, playing } = data) => {
        updateRoom(master, id, text, maxPlayer, time, width, height, playing);
    });

    socket.on('room join success', ({ id, room } = { ...data }) => {
        if (id != socket.id) { // chủ phòng nhận đc tin hiệu có người vào phòng
            Toast.fire({
                icon: "info",
                title: id + " đã vào phòng!"
            });
        } else { // người vào phòng của chủ phòng thành công
            masterWidth = room.width;
            masterHeight = room.height;
            myWidth = window.innerWidth * 70 / 100;
            myHeight = window.innerHeight;
            // resizeCanvas(myWidth, myHeight);
            // sketch.resizeCanvas(myWidth, myHeight);
            resizeCanvas(masterWidth, masterHeight);
            sketch.resizeCanvas(masterWidth*0.7, masterHeight);
            $('#menu').stop().slideUp(1000, '', () => {
                showSketch();
            });
        }
    })

    socket.on('room leave', leave => {
        if (leave != socket.id) {
            Toast.fire({
                icon: "info",
                title: leave + " đã thoát phòng!"
            });
        }
        // updateRoom(master, id, text, maxPlayer, time, width, height, playing);
    })

    socket.on('room delete', id => {
        $('#' + id).remove();
    })

    socket.on('rooms update', rooms => {
        $('#ban > tbody').html('');
        for (var i in rooms) {
            let { master, id, text, maxPlayer, time, width, height, playing } = rooms[i];
            addRoom(master, id, text, maxPlayer, time, width, height, playing);
        }
    })

    $('#create').click(function() {
        // $('#menu').css('filter', 'brightness(50%)');
        (async function getMax(text) {
            const { value: maxPlayer } = await Swal.fire({
                title: 'Enter your max player',
                input: 'number',
                inputPlaceholder: text,
                showCancelButton: true,
                inputValidator: (value) => {
                    return new Promise((resolve) => {
                        if (value < 3 || value > 10) {
                            resolve(text + ' :)')
                        }
                        resolve();
                    })
                }
            })

            if (maxPlayer) {
                resizeCanvas(window.innerWidth * 70 / 100, window.innerHeight);
                sketch.resizeCanvas(window.innerWidth * 70 / 100, window.innerHeight);
                socket.emit('room create', { maxPlayer: maxPlayer, width: window.innerWidth, height: window.innerHeight });

                showSketch();
            }

        })("3 - 10");
    });

    $('#chatinput').keypress((e)=>{
        if (e.keyCode == 13) {
            socket.emit('room chat', $('#chatinput').val());
            $('#chatinput').val('');
        }
    })

    $('#close').click(function() {
        $('#front').slideUp(10);
        $('#behind').css('filter', 'brightness(100%)');
    })

    $('#error').click(function() {
        Swal.fire({
            title: 'Hế lô, xin chào :3',
            text: "Nếu tìm thấy lỗi vui lòng chụp ảnh màn hình lỗi và gửi cho tui mau!!",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Vào trang cá nhân của tác giả!'
        }).then((result) => {
            if (result.value) {
                $.ajax({
                    url: '/error',
                    method: 'POST'
                }).done((response) => {
                    window.open(response, '_blank');
                })
            }
        })
    });

    $('#exit').click(function() {
        socket.emit('room disconnect');
        $('body').css('overflow', '');
    })

    socket.emit('rooms update');
})

// Swal.fire({
//     title: 'Multiple inputs',
//     html: '<input id="swal-input1" type="number" placeholder="Max player" class="swal2-input" autofocus>' +
//         '<input id="swal-input2" type="number" placeholder="Số vòng" class="swal2-input">',
//     preConfirm: function() {
//         return new Promise(function(resolve) {
//             if (result) {
//                 resolve([
//                     $('#swal-input1').val(),
//                     $('#swal-input2').val()
//                 ]);
//             }
//         });
//     }
// })