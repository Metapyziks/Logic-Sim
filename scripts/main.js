function LogicSim()
{
	var myIsDragging = false;
	var myDraggedGate = null;
	
	var myGridSize = 32;
	var myGridImage = null;

	this.canvas = null;
	this.context = null;
	
	this.toolbar = null;
	
	this.mouseX = 0;
	this.mouseY = 0;
	
	this.gates = new Array();
	
	this.initialize = function()
	{
		this.canvas = document.getElementById( "canvas" );
		this.context = this.canvas.getContext( "2d" );
		
		this.toolbar = new Toolbar();
		var def = this.toolbar.addGroup( "Default Gates" );
		def.addItem( new BufferGate() );
		def.addItem( new NotGate() );
		def.addItem( new AndGate() );
		def.addItem( new OrGate() );
		var cus = this.toolbar.addGroup( "Custom Gates" );
		
		this.changeGridSize( 32 );
		
		this.onResizeCanvas();
	}
	
	this.clear = function()
	{
		this.gates = new Array();
	}
	
	this.startDragging = function( gateType )
	{
		myIsDragging = true;
		myDraggedGate = new Gate( gateType, this.mouseX, this.mouseY );
	}
	
	this.stopDragging = function()
	{	
		myIsDragging = false;
	
		if( this.mouseX >= 256 )
		{
			var x = Math.round( this.mouseX / myGridSize ) * myGridSize;
			var y = Math.round( this.mouseY / myGridSize ) * myGridSize;
			
			myDraggedGate.x = x;
			myDraggedGate.y = y;
			
			this.gates.push( myDraggedGate );
		}
		
		myDraggedGate = null;
	}
	
	this.mouseMove = function( x, y )
	{
		this.mouseX = x;
		this.mouseY = y;
		
		this.toolbar.mouseMove( x, y );
	}
	
	this.mouseDown = function( x, y )
	{
		this.mouseX = x;
		this.mouseY = y;
		
		if( x < 256 )
			this.toolbar.mouseDown( x, y );
	}
	
	this.mouseUp = function( x, y )
	{
		this.mouseX = x;
		this.mouseY = y;
		
		if( myIsDragging )
			this.stopDragging();
		
		if( x < 256 )
			this.toolbar.mouseUp( x, y );
	}
	
	this.click = function( x, y )
	{
		this.mouseX = x;
		this.mouseY = y;
		
		if( x < 256 )
			this.toolbar.click( x, y );
	}
	
	this.changeGridSize = function( size )
	{
		myGridSize = size;
	}

	this.onResizeCanvas = function()
	{
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}

	this.render = function()
	{		
		for( var x = this.toolbar.width; x < this.canvas.width; x += myGridSize )
		{
			for( var y = 0; y < this.canvas.height; y +=  myGridSize )
			{
				this.context.fillStyle = ( x % ( 2 * myGridSize ) == y % ( 2 * myGridSize ) )
					? "#CCCCCC" : "#DDDDDD";
				this.context.fillRect( x, y, myGridSize, myGridSize );
			}
		}
		
		this.toolbar.render( this.context );
		
		for( var i = 0; i < this.gates.length; ++ i )
			this.gates[ i ].render( this.context );
		
		if( myIsDragging )
		{
			myDraggedGate.x = Math.round( this.mouseX / myGridSize ) * myGridSize;
			myDraggedGate.y = Math.round( this.mouseY / myGridSize ) * myGridSize;
			myDraggedGate.render( this.context );
		}
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
	logicSim.initialize();
	logicSim.run();
}

window.onmousemove = function( e )
{
	if( e )
		logicSim.mouseMove( e.pageX, e.pageY );
	else
		logicSim.mouseMove( window.event.clientX, window.event.clientY );
}

window.onmousedown = function( e )
{
	if( e )
		logicSim.mouseDown( e.pageX, e.pageY );
	else
		logicSim.mouseDown( window.event.clientX, window.event.clientY );
}

window.onmouseup = function( e )
{
	if( e )
		logicSim.mouseUp( e.pageX, e.pageY );
	else
		logicSim.mouseUp( window.event.clientX, window.event.clientY );
}

window.onclick = function( e )
{
	if( e )
		logicSim.click( e.pageX, e.pageY );
	else
		logicSim.click( window.event.clientX, window.event.clientY );
}

function onResizeCanvas()
{
	logicSim.onResizeCanvas();
}