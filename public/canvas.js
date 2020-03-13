(function() {
    var signature = $('input[name=signature-data]');
    var canvas = $('#signature-canvas');

    var ctx = canvas[0].getContext('2d');

    ctx.strokeStyle = '#2a1d21';
    ctx.lineWidth = 1;

    // BEGIN PATH at mousedown
    canvas.on('mousedown', function(e) {
        var positionX = e.offsetX;
        var positionY = e.offsetY;
        ctx.beginPath();
        ctx.moveTo(positionX, positionY);

        // STROKE PATH on mousemove
        canvas.on('mousemove', function(e) {
            // console.log('e.offsetX: ', e.offsetX);
            positionX = e.offsetX;
            positionY = e.offsetY;
            ctx.lineTo(positionX, positionY);
            ctx.stroke();
        });

        // UNBIND mousemove and save toDataURL on mouseup
        canvas.on('mouseup', function() {
            canvas.unbind('mousemove');
            signature.val(canvas[0].toDataURL());
        });
    });
})();
