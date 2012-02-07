var canvas;
var context;

window.onload = function()
{
	canvas = document.getElementById( 'canvas' );
	context = canvas.getContext( '2d' );
	
	onResizeCanvas();
};

onResizeCanvas = function()
{
	
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	render();
};

render = function()
{
	for( var x = 0; x < canvas.width; x += 64 )
	{
		for( var y = 0; y < canvas.height; y += 64 )
		{
			context.fillStyle = ( x % 128 == y % 128 ) ? '#CCCCCC' : '#DDDDDD';
			context.fillRect( x, y, 64, 64 );
		}
	}
};