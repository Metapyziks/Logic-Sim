function LogicSim()
{
	this.gridSize = 32;
	this.gridImage = null;

	this.canvas = null;
	this.context = null;
	
	this.toolbar = null;
	
	this.onInitialize = function()
	{
		this.canvas = document.getElementById( "canvas" );
		this.context = this.canvas.getContext( "2d" );
		
		this.toolbar = new Toolbar();
		this.toolbar.addGroup( "Test Group" );
		this.toolbar.addGroup( "Another Group" );
		this.toolbar.addGroup( "And another" );
		this.toolbar.addGroup( "And so on" );
		
		this.changeGridSize( 32 );
		
		this.onResizeCanvas();
	}
	
	this.onMouseMove = function( x, y )
	{
	
	}
	
	this.onClick = function( x, y )
	{
		if( x < 256 )
			this.toolbar.onClick( x, y );
	}
	
	this.changeGridSize = function( size )
	{
		this.gridSize = size;
	}

	this.onResizeCanvas = function()
	{
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}

	this.render = function()
	{		
		for( var x = this.toolbar.width; x < this.canvas.width; x += this.gridSize )
		{
			for( var y = 0; y < this.canvas.height; y +=  this.gridSize )
			{
				this.context.fillStyle = ( x % ( 2 * this.gridSize ) == y % ( 2 * this.gridSize ) )
					? "#CCCCCC" : "#DDDDDD";
				this.context.fillRect( x, y, this.gridSize, this.gridSize );
			}
		}
		
		this.toolbar.render( this.context );
	}
	
	this.run = function()
	{
		setInterval( this.mainLoop, 1000.0 / 60.0, this );
	}
	
	this.mainLoop = function( self )
	{
		self.render();
	}
}

logicSim = new LogicSim();

window.onload = function()
{
	logicSim.onInitialize();
	logicSim.run();
}

window.onmousemove = function( e )
{
	if( e )
		logicSim.onMouseMove( e.pageX, e.pageY );
	else
		logicSim.onMouseMove( window.event.clientX, window.event.clientY );
}

window.onclick = function( e )
{
	if( e )
		logicSim.onClick( e.pageX, e.pageY );
	else
		logicSim.onClick( window.event.clientX, window.event.clientY );
}

/*images.onAllLoaded = function()
{
	logicSim.render( logicSim.context );
}*/

function onResizeCanvas()
{
	logicSim.onResizeCanvas();
}