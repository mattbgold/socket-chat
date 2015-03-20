var socket = io();

var cmdStack = [],
	cmdPtr = -1,
	colors = ['F00', '0F0', '00F', 'FF0', 'F0F', '0FF'],
	myCol = '#' + colors[Math.floor(Math.random() * 6)];

// 3D transform vars
var rMouseDown = 0,
	cx = 0,
	cy = 0,
	degX = 25,
	degY = 10,
	cdegx = 25,
	cdegy = 10,
	tRotate = 'RotateY(25deg) rotateX(10deg)',
	tPerspective = 2000,
	tTranslateZ = 0;
	
// document ready
// ==============
$(function() {
	socket.emit('connected', myCol);
	$('form').submit(sendMessage);
});

// assign event handlers
// =====================

socket.on('load', function(oldMessages) {
	$.each(oldMessages, function(i, msg) {
		addMessage(msg.msg, msg.col);
	});
	window.scrollTo(0, document.body.scrollHeight);
});

socket.on('chat message', function(msg, col) {
	addMessage(msg, col);
});

socket.on('connected', function(col) {
    addMessage('<p style="font-size:20px;">➪ user connected</p>', col);
});

document.body.onmousedown = function(e) {
	if (e.which === 3) {
		rMouseDown = 1;
		cx = e.clientX;
		cy = e.clientY;
	}

}
document.body.onmouseup = function(e) {
	if (e.which === 3) {
		rMouseDown = 0;
		cdegx = degX;
		cdegy = degY;
	}
}

document.addEventListener('mousemove', function(e) {
	// vars
	if (!rMouseDown) {
		return false;
	}
	var deltaX = (cx - e.clientX) * .4,
		deltaY = (cy - e.clientY) * .4;
	degX = cdegx + deltaX,
		degY = cdegy + deltaY

	tRotate = 'rotateY(' + degX + 'deg) rotateX(' + degY + 'deg)';
	$('.container')[0].style['-webkit-transform'] = 'perspective(' + tPerspective + 'px) ' + tRotate;
	$('.container')[0].style['transform'] = 'perspective(' + tPerspective + 'px) ' + tRotate;
});

Hamster(document).wheel(function(event, delta, deltaX, deltaY) {
	if (event.originalEvent.shiftKey) {
		if (delta === 1) {
			tTranslateZ += 100;
		} else if (delta === -1) {
			tTranslateZ -= 100;
		}
		$('.zoom-container')[0].style['-webkit-transform'] = ' perspective(' + tPerspective + 'px) translateZ(' + tTranslateZ + 'px) ';
		$('.zoom-container')[0].style['transform'] = ' perspective(' + tPerspective + 'px) translateZ(' + tTranslateZ + 'px) ';
		event.preventDefault();
		return false;
	}
});

$('#m').keydown(function(e) {
	switch (e.keyCode) {
		case 38:
			// handle up
			if (cmdStack[cmdPtr + 1]) {
				cmdPtr++;
				$('#m').val(cmdStack[cmdPtr]);
			}
			break;
		case 40:
			// handle down
			if (cmdPtr >= 0) {
				cmdPtr--;
				$('#m').val(cmdStack[cmdPtr]);
			}
			break;
	}
});

// functions
// =========
	
var sendMessage = function() {
	if (!$('#m').val().trim()) {
		return false;
	}
	
	var msg = $('#m').val();
	cmdStack.unshift(msg);
	
	socket.emit('chat message', msg, myCol);
	
	$('#m').val('');
	cmdPtr = -1;
	
	return false;
};

var addMessage = function(msg, col) {
	var li = $('<li style="text-shadow: 0 0 10px rgba(255,255,255,1) , 0 0 20px rgba(255,255,255,1) , 0 0 30px rgba(255,255,255,1) , 0 0 40px ' + col + ' , 0 0 70px ' + col + ' , 0 0 80px ' + col + ' , 0 0 100px ' + col + ';">').append($('<div style="opacity: 0;"></div>').html(msg));
	$('#messages').append(li);
	li.children('div').fadeTo(500, 1);

	var $lis = $('#messages').children();
	if ($lis.length > 10) {
		fadeAway($lis[$lis.length - 11]);
	}
}

var fadeAway = function(li) {
	$(li).children('div').fadeTo(500, 0, function() {
		$(this).slideUp(700, function() {
			$(this).parent().remove();
		});
	});
};

var updateNeon = function() {
	var $sel = $('li > div');
	$.each($sel, function(i, dv) {
		var $d = $(dv);
		if ($d.css('opacity').charAt(2) === '8') {
			$d.css('opacity', '1');
		}
		if (Math.random() < .07 && $d.css('opacity') === '1') {
			$d.css('opacity', '.9');
		}
	});
};

setInterval(updateNeon, 100);