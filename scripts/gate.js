SocketFace = new Object();

SocketFace.left 	= "LEFT";
SocketFace.top 		= "TOP";
SocketFace.right 	= "RIGHT";
SocketFace.bottom 	= "BOTTOM";

function SocketInfo( face, offset, label )
{
	this.face = face;
	this.offset = offset;
	this.label = label;
	
	this.isLeft 	= this.face == SocketFace.left;
	this.isTop 		= this.face == SocketFace.top;
	this.isRight 	= this.face == SocketFace.right;
	this.isBottom 	= this.face == SocketFace.bottom;
	
	this.getPosition = function( gateType, x, y )
	{
		return new Pos(
			x + 
			( ( this.face == SocketFace.left ) ? - gateType.width / 2
			: ( this.face == SocketFace.right ) ? gateType.width / 2
			: gateType.width * ( this.offset - 0.5 ) ),
			y +
			( ( this.face == SocketFace.top ) ? - gateType.height / 2
			: ( this.face == SocketFace.bottom ) ? gateType.height / 2
			: gateType.height * ( this.offset - 0.5 ) )
		);
	}
}

function GateType( name, width, height, inputs, outputs )
{
	this.name = name;

	this.width = width;
	this.height = height;
	
	this.inputs = inputs;
	this.outputs = outputs;
	
	this.func = function( gate, inputs )
	{
		return [ false ];
	}
	
	this.initialize = function( gate )
	{
		
	}
	
	this.click = function( gate )
	{
		
	}
	
	this.mouseDown = function( gate )
	{
	
	}
	
	this.mouseUp = function( gate )
	{
	
	}
	
	this.render = function( context, x, y, gate )
	{
		context.strokeStyle = "#000000";
		context.lineWidth = 2;
		
		for( var i = 0; i < inputs.length + outputs.length; ++ i )
		{
			var inp = ( i < inputs.length ? inputs[ i ] : outputs[ i - inputs.length ] );
			var start = inp.getPosition( this, x, y );
			var end = inp.getPosition( this, x, y );
			
			if( inp.face == SocketFace.left || inp.face == SocketFace.right )
				end.x = x;
			else
				end.y = y;
				
			context.beginPath();
			context.moveTo( start.x, start.y );
			context.lineTo( end.x, end.y );
			context.stroke();
			context.closePath();
		}
	}
}

function DefaultGate( name, image, inputs, outputs )
{
	this.__proto__ = new GateType( name, image.width, image.height, inputs, outputs );
	
	this.image = image;
	
	this.render = function( context, x, y, gate )
	{
		this.__proto__.render( context, x, y, gate );
		context.drawImage( this.image, x - this.width / 2, y - this.height / 2 );
	}
}

function BufferGate()
{
	this.__proto__ = new DefaultGate( "BUF", images.buffer,
		[ 
			new SocketInfo( SocketFace.left, 0.5, "A" )
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( gate, inputs )
	{
		return [ inputs[ 0 ] ];
	}
}

function AndGate()
{
	this.__proto__ = new DefaultGate( "AND", images.and,
		[ 
			new SocketInfo( SocketFace.left, 0.5 - 0.125, "A" ),
			new SocketInfo( SocketFace.left, 0.5 + 0.125, "B" )
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( gate, inputs )
	{
		return [ inputs[ 0 ] && inputs[ 1 ] ];
	}
}

function OrGate()
{
	this.__proto__ = new DefaultGate( "OR", images.or,
		[ 
			new SocketInfo( SocketFace.left, 0.5 - 0.125, "A" ),
			new SocketInfo( SocketFace.left, 0.5 + 0.125, "B" )
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( gate, inputs )
	{
		return [ inputs[ 0 ] || inputs[ 1 ] ];
	}
}

function XorGate()
{
	this.__proto__ = new DefaultGate( "XOR", images.xor,
		[ 
			new SocketInfo( SocketFace.left, 0.5 - 0.125, "A" ),
			new SocketInfo( SocketFace.left, 0.5 + 0.125, "B" )
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( gate, inputs )
	{
		return [ inputs[ 0 ] ^ inputs[ 1 ] ];
	}
}

function NotGate()
{
	this.__proto__ = new DefaultGate( "NOT", images.not,
		[ 
			new SocketInfo( SocketFace.left, 0.5, "A" )
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( gate, inputs )
	{
		return [ !inputs[ 0 ] ];
	}
}

function NandGate()
{
	this.__proto__ = new DefaultGate( "NAND", images.nand,
		[ 
			new SocketInfo( SocketFace.left, 0.5 - 0.125, "A" ),
			new SocketInfo( SocketFace.left, 0.5 + 0.125, "B" )
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( gate, inputs )
	{
		return [ !inputs[ 0 ] || !inputs[ 1 ] ];
	}
}

function NorGate()
{
	this.__proto__ = new DefaultGate( "NOR", images.nor,
		[ 
			new SocketInfo( SocketFace.left, 0.5 - 0.125, "A" ),
			new SocketInfo( SocketFace.left, 0.5 + 0.125, "B" )
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( gate, inputs )
	{
		return [ !inputs[ 0 ] && !inputs[ 1 ] ];
	}
}

function XnorGate()
{
	this.__proto__ = new DefaultGate( "XNOR", images.xnor,
		[ 
			new SocketInfo( SocketFace.left, 0.5 - 0.125, "A" ),
			new SocketInfo( SocketFace.left, 0.5 + 0.125, "B" )
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( gate, inputs )
	{
		return [ inputs[ 0 ] == inputs[ 1 ] ];
	}
}

function ConstInput()
{
	this.onImage = images.conston;
	this.offImage = images.constoff;

	this.__proto__ = new DefaultGate( "IN", images.conston, [],
		[ 
			new SocketInfo( SocketFace.bottom, 0.5, "Q" )
		]
	);
	
	this.initialize = function( gate )
	{
		gate.on = false;
	}
	
	this.click = function( gate )
	{
		gate.on = !gate.on;
	}
	
	this.func = function( gate, inputs )
	{
		return [ gate.on ];
	}
	
	this.render = function( context, x, y, gate )
	{
		this.__proto__.render( context, x, y );
		context.drawImage( gate != null && gate.on ? this.onImage : this.offImage,
			x - this.width / 2, y - this.height / 2 );
	}
}

function ClockInput()
{
	this.__proto__ = new DefaultGate( "CLOCK", images.clock, [],
		[ 
			new SocketInfo( SocketFace.bottom, 0.5, "Q" )
		]
	);
	
	this.func = function( gate, inputs )
	{
		var period = 1000 / gate.freq;
		return [ new Date().getTime() % period >= period / 2 ];
	}
	
	this.initialize = function( gate )
	{
		gate.freq = 1;
	}
	
	this.click = function( gate )
	{
		gate.freq *= 2;
		
		if( gate.freq >= 32 )
			gate.freq = 0.125;
	}
}

function ToggleSwitch()
{
	this.openImage = images.switchopen;
	this.closedImage = images.switchclosed;

	this.__proto__ = new DefaultGate( "TSWITCH", this.openImage,
		[
			new SocketInfo( SocketFace.left, 0.5, "A" ),
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( gate, inputs )
	{
		return [ !gate.open && inputs[ 0 ] ];
	}
	
	this.initialize = function( gate )
	{
		gate.open = true;
	}
	
	this.click = function( gate )
	{
		gate.open = !gate.open;
	}
	
	this.render = function( context, x, y, gate )
	{
		this.__proto__.render( context, x, y );
		context.drawImage( gate == null || gate.open ? this.openImage : this.closedImage,
			x - this.width / 2, y - this.height / 2 );
	}
}

function PushSwitchA()
{
	this.openImage = images.pushswitchaopen;
	this.closedImage = images.pushswitchaclosed;

	this.__proto__ = new DefaultGate( "PSWITCHA", this.openImage,
		[
			new SocketInfo( SocketFace.left, 0.5, "A" ),
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( gate, inputs )
	{
		return [ !gate.open && inputs[ 0 ] ];
	}
	
	this.initialize = function( gate )
	{
		gate.open = true;
	}
	
	this.mouseDown = function( gate )
	{
		gate.open = false;
	}
	
	this.mouseUp = function( gate )
	{
		gate.open = true;
	}
	
	this.render = function( context, x, y, gate )
	{
		this.__proto__.render( context, x, y );
		context.drawImage( gate == null || gate.open ? this.openImage : this.closedImage,
			x - this.width / 2, y - this.height / 2 );
	}
}

function PushSwitchB()
{
	this.openImage = images.pushswitchbopen;
	this.closedImage = images.pushswitchbclosed;

	this.__proto__ = new DefaultGate( "PSWITCHB", this.closedImage,
		[
			new SocketInfo( SocketFace.left, 0.5, "A" ),
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( gate, inputs )
	{
		return [ !gate.open && inputs[ 0 ] ];
	}
	
	this.initialize = function( gate )
	{
		gate.open = false;
	}
	
	this.mouseDown = function( gate )
	{
		gate.open = true;
	}
	
	this.mouseUp = function( gate )
	{
		gate.open = false;
	}
	
	this.render = function( context, x, y, gate )
	{
		this.__proto__.render( context, x, y );
		context.drawImage( gate != null && gate.open ? this.openImage : this.closedImage,
			x - this.width / 2, y - this.height / 2 );
	}
}

function OutputDisplay()
{
	this.onImage = images.outon;
	this.offImage = images.outoff;

	this.__proto__ = new DefaultGate( "OUT", this.onImage,
		[
			new SocketInfo( SocketFace.top, 0.5, "A" ),
		],
		[]
	);
	
	this.func = function( gate, inputs )
	{
		gate.on = inputs[ 0 ];
		return [];
	}
	
	this.initialize = function( gate )
	{
		gate.on = false;
	}
	
	this.render = function( context, x, y, gate )
	{
		this.__proto__.render( context, x, y );
		context.drawImage( gate == null || !gate.on ? this.offImage : this.onImage,
			x - this.width / 2, y - this.height / 2 );
	}
}

function Link( gate, socket )
{
	this.gate = gate;
	this.socket = socket;
	
	this.getValue = function()
	{
		return this.gate.getOutput( this.socket );
	}
	
	this.equals = function( obj )
	{
		return this.gate == obj.gate && this.socket == obj.socket;
	}
}

function Gate( gateType, x, y )
{
	var myOutputs = new Array();
	var myNextOutputs = new Array();
	var myInLinks = new Array();
	
	this.type = gateType;
	
	this.x = x;
	this.y = y;
	
	this.isMouseDown = false;
	
	this.width = this.type.width;
	this.height = this.type.height;
	
	this.inputs = this.type.inputs;
	this.outputs = this.type.outputs;
	
	for( var i = 0; i < this.type.inputs.length; ++i )
		myInLinks[ i ] = null;
	
	for( var i = 0; i < this.type.outputs.length; ++i )
		myOutputs[ i ] = false;
	
	this.getRect = function( gridSize )
	{
		if( !gridSize )
			gridSize = 1;
	
		var rl = Math.round( this.x - this.width / 2 );
		var rt = Math.round( this.y - this.height / 2 );
		var rr = Math.round( this.x + this.width / 2 );
		var rb = Math.round( this.y + this.height / 2 );
		
		rl = Math.floor( rl / gridSize ) * gridSize;
		rt = Math.floor( rt / gridSize ) * gridSize;
		rr = Math.ceil( rr / gridSize ) * gridSize;
		rb = Math.ceil( rb / gridSize ) * gridSize;
		
		return new Rect( rl, rt, rr - rl, rb - rt );
	}
	
	this.linkInput = function( gate, output, input )
	{
		var index = this.inputs.indexOf( input );
		myInLinks[ index ] = new Link( gate, output );
	}
	
	this.isLinked = function( gate )
	{
		for( var i = 0; i < this.inputs.length; ++ i )
			if( myInLinks[ i ] != null && myInLinks[ i ].gate == gate )
				return true;
		
		return false;
	}
	
	this.unlinkGate = function( gate )
	{
		for( var i = 0; i < this.inputs.length; ++ i )
			if( myInLinks[ i ] != null && myInLinks[ i ].gate == gate )
				myInLinks[ i ] = null;
	}
	
	this.unlinkInput = function( input )
	{
		var index = this.inputs.indexOf( input );
		myInLinks[ index ] = null;
	}
	
	this.getOutput = function( output )
	{
		var index = this.outputs.indexOf( output );
		return myOutputs[ index ];
	}
	
	this.click = function()
	{
		this.type.click( this );
	}
	
	this.mouseDown = function()
	{
		this.isMouseDown = true;
		this.type.mouseDown( this );
	}
	
	this.mouseUp = function()
	{
		this.isMouseDown = false;
		this.type.mouseUp( this );
	}
	
	this.step = function()
	{
		var inVals = new Array();
	
		for( var i = 0; i < this.inputs.length; ++ i )
		{
			var link = myInLinks[ i ];
			inVals[ i ] = ( myInLinks[ i ] == null )
				? false : link.getValue();
		}
		
		myNextOutputs = this.type.func( this, inVals );
	}
	
	this.commit = function()
	{
		myOutputs = myNextOutputs;
	}
	
	this.render = function( context )
	{
		this.type.render( context, this.x, this.y, this );
		
		context.strokeStyle = "#000000";
		context.lineWidth = 2;
		context.fillStyle = "#9999FF";
		
		for( var i = 0; i < this.inputs.length + this.outputs.length; ++ i )
		{
			var inp = ( i < this.inputs.length ? this.inputs[ i ]
				: this.outputs[ i - this.inputs.length ] );
			var pos = inp.getPosition( this.type, this.x, this.y );
				
			if( i < this.inputs.length )
			{
				if( myInLinks[ i ] != null )
					context.fillStyle = myInLinks[ i ].getValue() ? "#FF9999" : "#9999FF";
				else
					context.fillStyle = "#999999";
			}
			else
			{
				context.fillStyle = myOutputs[ i - this.inputs.length ]
					? "#FF9999" : "#9999FF";
			}
				
			context.beginPath();
			context.arc( pos.x, pos.y, 4, 0, Math.PI * 2, true );
			context.fill();
			context.stroke();
			context.closePath();
		}
	}
	
	this.type.initialize( this );
}
