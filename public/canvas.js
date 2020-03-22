(function() {
    var signature = $('input[name=signature-data]');
    var canvas = $('#signature-canvas');
    var deleteButton = $('#delete');
    var ctx = canvas[0].getContext('2d');

    ctx.strokeStyle = '#2a1d21';
    ctx.lineWidth = 2;

    canvas.on('mousedown', function(e) {
        var positionX = e.offsetX;
        var positionY = e.offsetY;
        ctx.beginPath();
        ctx.moveTo(positionX, positionY);

        canvas.on('mousemove', function(e) {
            positionX = e.offsetX;
            positionY = e.offsetY;
            ctx.lineTo(positionX, positionY);
            ctx.stroke();
        });

        canvas.on('mouseup', function() {
            canvas.unbind('mousemove');
            signature.val(canvas[0].toDataURL());
        });
    });

    canvas.on('touchstart', function(e) {
        e.preventDefault();

        var positionX = ((e.targetTouches[0].pageX - e.target.offsetLeft) * 4) / 3;
        var positionY = ((e.targetTouches[0].pageY - e.target.offsetTop) * 4) / 3;
        ctx.beginPath();
        ctx.moveTo(positionX, positionY);

        canvas.on('touchmove', function(e) {
            positionX = ((e.targetTouches[0].pageX - e.target.offsetLeft) * 4) / 3;
            positionY = ((e.targetTouches[0].pageY - e.target.offsetTop) * 4) / 3;
            ctx.lineTo(positionX, positionY);
            ctx.stroke();
        });

        canvas.on('touchend', function() {
            canvas.unbind('touchmove');
            signature.val(canvas[0].toDataURL());
        });
    });

    deleteButton.click(function(e) {
        e.preventDefault();
        ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
    });
})();
