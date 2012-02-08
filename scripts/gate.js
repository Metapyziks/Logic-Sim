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
}

function GateType( name, width, height, inputs, outputs )
{
	this.name = name;

	this.width = width;
	this.height = height;
	
	this.inputs = inputs;
	this.outputs = outputs;
	
	this.func = function( inputs )
	{
		return [ false ];
	}
	
	this.render = function( context, x, y )
	{
		context.strokeStyle = '#000000';
		context.lineWidth = 2;
		context.fillStyle = '#9999FF';
		
		for( var i = 0; i < inputs.length + outputs.length; ++ i )
		{
			var inp = ( i < inputs.length ? inputs[ i ] : outputs[ i - inputs.length ] );
			var startX = ( inp.face == SocketFace.left ) ? -width / 2
				: ( inp.face == SocketFace.right ) ? width / 2
				: width * ( inp.offset - 0.5 );
			var startY = ( inp.face == SocketFace.top ) ? -height / 2
				: ( inp.face == SocketFace.bottom ) ? height / 2
				: height * ( inp.offset - 0.5 );
			var endX = ( inp.face == SocketFace.left ) ? 0
				: ( inp.face == SocketFace.right ) ? 0
				: width * ( inp.offset - 0.5 );
			var endY = ( inp.face == SocketFace.top ) ? 0
				: ( inp.face == SocketFace.bottom ) ? 0
				: height * ( inp.offset - 0.5 );
				
			if( i == inputs.length )
				context.fillStyle = '#FF9999';
				
			context.beginPath();
			context.moveTo( startX + x, startY + y );
			context.lineTo( endX + x, endY + y );
			context.stroke();
			context.closePath();
			context.beginPath();
			context.arc( startX + x, startY + y, 3, 0, Math.PI * 2, true );
			context.fill();
			context.stroke();
			context.closePath();
		}
	}
}

function DefaultGate( name, image, inputs, outputs )
{
	this.__proto__ = new GateType( name, image.width, image.height, inputs, outputs );
	
	this.image = image;
	
	this.render = function( context, x, y )
	{
		this.__proto__.render( context, x, y );
		context.drawImage( this.image, x - this.width / 2, y - this.height / 2 );
	}
}

function BufferGate()
{
	this.__proto__ = new DefaultGate( "BUF", images.load( "images/buffer.png" ),
		[ 
			new SocketInfo( SocketFace.left, 0.5, "A" )
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( inputs )
	{
		return [ inputs[ 0 ] ];
	}
}

function NotGate()
{
	this.__proto__ = new DefaultGate( "NOT", images.load( "images/not.png" ),
		[ 
			new SocketInfo( SocketFace.left, 0.5, "A" )
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( inputs )
	{
		return [ !inputs[ 0 ] ];
	}
}

function AndGate()
{
	this.__proto__ = new DefaultGate( "AND", images.load( "images/and.png" ),
		[ 
			new SocketInfo( SocketFace.left, 0.5 - 0.125, "A" ),
			new SocketInfo( SocketFace.left, 0.5 + 0.125, "B" )
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( inputs )
	{
		return [ inputs[ 0 ] && inputs[ 1 ] ];
	}
}

function OrGate()
{
	this.__proto__ = new DefaultGate( "OR", images.load( "images/or.png" ),
		[ 
			new SocketInfo( SocketFace.left, 0.5 - 0.125, "A" ),
			new SocketInfo( SocketFace.left, 0.5 + 0.125, "B" )
		],
		[ 
			new SocketInfo( SocketFace.right, 0.5, "Q" )
		]
	);
	
	this.func = function( inputs )
	{
		return [ inputs[ 0 ] || inputs[ 1 ] ];
	}
}

function Link( gate, output )
{
	this.gate = gate;
	this.output = output;
}

function Gate( gateType, x, y )
{
	var myInputs = new Array();
	var myOutputs = new Array();
	var myNextOutputs = new Array();
	var myInLinks = new Array();
	
	this.type = gateType;
	
	this.x = x;
	this.y = y;
	
	for( var i = 0; i < this.type.inputs.length; ++i )
	{
		myInputs[ i ] = false;
		myInLinks[ i ] = null;
	}
	
	for( var i = 0; i < this.type.outputs.length; ++i )
		myOutputs[ i ] = false;
	
	this.linkInput = function( gate, output, input )
	{
		var index = this.type.inputs.indexOf( input );
		myInLinks[ index ] = new Link( gate, output );
	}
	
	this.getOutput = function( output )
	{
		var index = this.type.outputs.indexOf( output );
		return myOutputs[ index ];
	}
	
	this.step = function()
	{
		var inputs = new Array();
	
		for( var i = 0; i < myInputs.length; ++ i )
		{
			var link = myInLinks[ i ];
			inputs[ i ] = myInLinks[ i ] == null ? false : link.gate.getOutput( link.output );
		}
		
		myNextOutputs = this.type.func( inputs );
	}
	
	this.commit = function()
	{
		myOutputs = myNextOutputs;
	}
	
	this.render = function( context )
	{
		this.type.render( context, this.x, this.y );
	}
}
