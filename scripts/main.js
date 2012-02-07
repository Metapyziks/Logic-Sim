function LogicSim()
{
	this.onInitialize = function()
	{
		this.canvas = document.getElementById( "canvas" );
		this.context = canvas.getContext( "2d" );
		
		this.toolbar = new Toolbar();
		this.toolbar.addGroup( "Test Group" );
		this.toolbar.addGroup( "Another Group" );
		this.toolbar.addGroup( "And another" );
		this.toolbar.addGroup( "And so on" );
		
		this.onResizeCanvas();
	};

	this.onResizeCanvas = function()
	{
		
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		
		this.render( this.context );
	};

	this.render = function( context )
	{
		var gridSize = 64;

		for( var x = 0; x < canvas.width; x += gridSize )
		{
			for( var y = 0; y < canvas.height; y +=  gridSize )
			{
				context.fillStyle = ( x % ( 2 * gridSize ) == y % ( 2 * gridSize ) ) ? "#CCCCCC" : "#DDDDDD";
				context.fillRect( x, y, gridSize, gridSize );
			}
		}
		
		this.toolbar.render( context );
	};
}

logicSim = new LogicSim();

window.onload = function()
{
	logicSim.onInitialize();
};

function onResizeCanvas()
{
	logicSim.onResizeCanvas();
};