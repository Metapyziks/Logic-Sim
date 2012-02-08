function LogicSim()
{
	var myIsDragging = false;
	var myDraggedGate = null;
	
	var myIsWiring = false;
	var myWireStart = null;
	
	var myGridSize = 32;
	var myGridImage = null;

	this.canvas = null;
	this.context = null;
	
	this.toolbar = null;
	
	this.mouseX = 0;
	this.mouseY = 0;
	
	this.gates = new Array();
	this.wireGroups = new Array();
	
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
		this.wireGroups = new Array();
	}
	
	this.startDragging = function( gateType )
	{
		myIsDragging = true;
		myDraggedGate = new Gate( gateType, this.mouseX, this.mouseY );
	}
	
	this.stopDragging = function()
	{
		if( this.mouseX >= 256 )
		{
			var x = Math.round( this.mouseX / myGridSize ) * myGridSize;
			var y = Math.round( this.mouseY / myGridSize ) * myGridSize;
			
			myDraggedGate.x = x;
			myDraggedGate.y = y;
			
			if( this.getCanPlace() )
				this.placeGate( myDraggedGate );
		}
		
		myIsDragging = false;
		myDraggedGate = null;
	}
	
	this.placeGate = function( gate )
	{
		var r0 = gate.getRect( myGridSize );
	
		for( var i = 0; i < this.gates.length; ++ i )
		{
			var other = this.gates[ i ];
			var r1 = other.getRect( myGridSize );
			
			if( r0.left == r1.right || r1.left == r0.right
				|| r0.top == r1.bottom || r1.top == r0.bottom )
			{				
				for( var j = 0; j < gate.inputs.length; ++ j )
				{
					var inp = gate.inputs[ j ];
					for( var k = 0; k < other.outputs.length; ++ k )
					{
						var out = other.outputs[ k ];
						
						if( inp.getPosition( gate.type, gate.x, gate.y ).equals(
							out.getPosition( other.type, other.x, other.y ) ) )
							gate.linkInput( other, out, inp );
					}
				}
				
				for( var j = 0; j < gate.outputs.length; ++ j )
				{
					var out = gate.outputs[ j ];
					for( var k = 0; k < other.inputs.length; ++ k )
					{
						var inp = other.inputs[ k ];
						
						if( out.getPosition( gate.type, gate.x, gate.y ).equals(
							inp.getPosition( other.type, other.x, other.y ) ) )
							other.linkInput( gate, out, inp );
					}
				}
			}
		}
		
		for( var i = 0; i < this.wireGroups.length; ++ i )
		{
			var group = this.wireGroups[ i ];
					
			for( var j = 0; j < gate.inputs.length; ++ j )
			{
				var pos = gate.inputs[ j ].getPosition( gate.type, gate.x, gate.y );
				
				if( group.crossesPos( pos ) )
					group.addOutput( gate, gate.inputs[ j ] );
			}
			
			for( var j = 0; j < gate.outputs.length; ++ j )
			{
				var pos = gate.outputs[ j ].getPosition( gate.type, gate.x, gate.y );
				
				if( group.crossesPos( pos ) )
					group.setInput( gate, gate.outputs[ j ] );
			}
		}
		
		this.gates.push( gate );
	}
	
	this.getCanPlace = function()
	{
		if( !myIsDragging )
			return false;
		
		var gate = myDraggedGate;		
		var rect = myDraggedGate.getRect();
		
		for( var i = 0; i < this.gates.length; ++i )
		{
			var other = this.gates[ i ].getRect();
			
			if( rect.intersects( other ) )
				return false;
		}
		
		var crossed = false;
		
		for( var i = 0; i < this.wireGroups.length; ++ i )
		{
			var group = this.wireGroups[ i ];
			for( var j = 0; j < gate.outputs.length; ++ j )
			{
				var out = gate.outputs[ j ];
				if( group.crossesPos( out.getPosition( gate.type, gate.x, gate.y ) ) )
				{
					if( crossed || group.input != null )
						return false;
					
					crossed = true;
				}
			}
		}
		
		return true;
	}
	
	this.startWiring = function( x, y )
	{
		var snap = myGridSize / 4;
	
		myIsWiring = true;
		myWireStart = new Pos(
			Math.round( x / snap ) * snap,
			Math.round( y / snap ) * snap
		);
	}
	
	this.stopWiring = function( x, y )
	{
		if( this.canPlaceWire() )
			this.placeWire( myWireStart, this.getWireEnd() );
		
		myIsWiring = false;
	}
	
	this.getWireEnd = function()
	{
		var snap = myGridSize / 4;
		
		var pos = new Pos(
			Math.round( this.mouseX / snap ) * snap,
			Math.round( this.mouseY / snap ) * snap
		);
		
		var diff = pos.sub( myWireStart );
		
		if( Math.abs( diff.x ) >= Math.abs( diff.y ) )
			pos.y = myWireStart.y;
		else
			pos.x = myWireStart.x;
			
		return pos;
	}
	
	this.canPlaceWire = function()
	{
		var end = this.getWireEnd();
		var wire = new Wire( myWireStart, end );
		
		var input = null;
		
		for( var i = 0; i < this.wireGroups.length; ++ i )
		{
			var group = this.wireGroups[ i ];
			
			if( group.canAddWire( wire ) && group.input != null )
			{
				if( input != null && !group.input.equals( input ) )
					return false;
				
				input = group.input;
			}
		}
		
		for( var i = 0; i < this.gates.length; ++ i )
		{
			var gate = this.gates[ i ];
			var rect = gate.getRect( myGridSize );
			
			if( wire.start.x == rect.right || rect.left == wire.end.x
				|| wire.start.y == rect.bottom || rect.top == wire.end.y )
			{
				for( var j = 0; j < gate.outputs.length; ++ j )
				{
					var inp = new Link( gate, gate.outputs[ j ] );
					var pos = gate.outputs[ j ].getPosition( gate.type, gate.x, gate.y );
					
					if( wire.crossesPos( pos ) )
					{
						if( input != null && !inp.equals( input ) )
							return false;
						
						input = inp;
					}
				}
			}
		}
		
		return true;
	}
	
	this.placeWire = function( start, end )
	{
		var wire = new Wire( start, end );
		
		for( var i = 0; i < this.gates.length; ++ i )
		{
			var gate = this.gates[ i ];
			var rect = gate.getRect( myGridSize );
			
			if( wire.start.x == rect.right || rect.left == wire.end.x
				|| wire.start.y == rect.bottom || rect.top == wire.end.y )
			{				
				for( var j = 0; j < gate.inputs.length; ++ j )
				{
					var pos = gate.inputs[ j ].getPosition( gate.type, gate.x, gate.y );
					
					if( wire.crossesPos( pos ) )
						wire.group.addOutput( gate, gate.inputs[ j ] );
				}
				
				for( var j = 0; j < gate.outputs.length; ++ j )
				{
					var pos = gate.outputs[ j ].getPosition( gate.type, gate.x, gate.y );
					
					if( wire.crossesPos( pos ) )
						wire.group.setInput( gate, gate.outputs[ j ] );
				}
			}
		}
	
		for( var i = 0; i < this.wireGroups.length; ++ i )
		{
			var group = this.wireGroups[ i ];
			if( group.canAddWire( wire ) )
				group.addWire( wire );
		}
		
		for( var i = this.wireGroups.length - 1; i >= 0; --i )
			if( this.wireGroups[ i ].isEmpty )
				this.wireGroups.splice( i, 1 );
		
		if( !this.wireGroups.contains( wire.group ) )
			this.wireGroups.push( wire.group );
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
		else
			this.startWiring( x, y );
	}
	
	this.mouseUp = function( x, y )
	{
		this.mouseX = x;
		this.mouseY = y;
		
		if( myIsDragging )
			this.stopDragging();
		else if( myIsWiring )
			this.stopWiring();
		
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
		
		for( var i = 0; i < this.wireGroups.length; ++ i )
			this.wireGroups[ i ].render( this.context );
			
		for( var i = 0; i < this.gates.length; ++ i )
			this.gates[ i ].render( this.context );
		
		this.toolbar.render( this.context );
		
		if( myIsDragging )
		{
			var goalX = Math.round( this.mouseX / myGridSize ) * myGridSize;
			var goalY = Math.round( this.mouseY / myGridSize ) * myGridSize;
			
			if( !this.getCanPlace() )
			{
				var rect = myDraggedGate.getRect( myGridSize );
				this.context.fillStyle = "#FF0000";
				this.context.fillRect( rect.left, rect.top, rect.width, rect.height );
			}
			
			myDraggedGate.x = goalX;
			myDraggedGate.y = goalY;
			myDraggedGate.render( this.context );
		}
		else if( myIsWiring )
		{		
			var end = this.getWireEnd();
		
			this.context.strokeStyle = this.canPlaceWire() ? "#009900" : "#990000";
			this.context.lineWidth = 2;
			this.context.beginPath();
			this.context.moveTo( myWireStart.x, myWireStart.y );
			this.context.lineTo( end.x, end.y );
			this.context.stroke();
			this.context.closePath();
		}
	}
	
	this.run = function()
	{
		setInterval( this.mainLoop, 1000.0 / 60.0, this );
	}
	
	this.mainLoop = function( self )
	{
		for( var i = 0; i < self.gates.length; ++ i )
			self.gates[ i ].step();
			
		for( var i = 0; i < self.gates.length; ++ i )
			self.gates[ i ].commit();
			
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