function Toolbar()
{
	this.sepimage = new Object();
	this.sepimage.end = images.sepend;
	this.sepimage.mid = images.sepmid;
	
	this.arrimage = new Object();
	this.arrimage.down = images.arrdown;
	this.arrimage.up = images.arrup;

	this.width = 256;
	this.isOpen = true;
	
	this.groups = new Array();
	
	this.addGroup = function( name )
	{
		var group = new ToolbarGroup( this, name );
		this.groups.push( group );
		return group;
	}
	
	this.render = function( context )
	{		
		context.fillStyle = "#FFFFFF";
		context.fillRect( 0, 0, this.width, window.innerHeight );
		
		var yPos = 0;
		for( var i = 0; i < this.groups.length; ++ i )
		{
			this.groups[ i ].y = yPos;
			yPos += this.groups[ i ].render( context );
		}
		
		context.fillStyle = "#000000";
		context.fillRect( this.width - 1, 0, 1, window.innerHeight );
	}
	
	this.mouseMove = function( x, y )
	{
		for( var i = 0; i < this.groups.length; ++ i )
			this.groups[ i ].mouseMove( x, y );
	}
	
	this.mouseDown = function( x, y )
	{
		var yPos = 0;
		for( var i = 0; i < this.groups.length; ++ i )
		{
			var height = this.groups[ i ].getInnerHeight() + 24;
			
			if( y < yPos + height )
			{
				this.groups[ i ].mouseDown( x, y );
				break;
			}
			
			yPos += height;
		}
	}
	
	this.mouseUp = function( x, y )
	{
		var yPos = 0;
		for( var i = 0; i < this.groups.length; ++ i )
		{
			var height = this.groups[ i ].getInnerHeight() + 24;
			
			if( y < yPos + height )
			{
				this.groups[ i ].mouseUp( x, y );
				break;
			}
			
			yPos += height;
		}
	}
	
	this.click = function( x, y )
	{
		var yPos = 0;
		for( var i = 0; i < this.groups.length; ++ i )
		{
			var height = this.groups[ i ].getInnerHeight() + 24;
			
			if( y < yPos + height )
			{
				this.groups[ i ].click( x, y );
				break;
			}
			
			yPos += height;
		}
	}
}

function ToolbarGroup( toolbar, name )
{
	this.toolbar = toolbar;

	this.name = name;
	this.items = new Array();
	
	this.padding = 16;
	this.itemSize = 64;
	
	this.y = 0;
	
	this.isOpen = true;
	this.curDelta = 1.0;
	
	this.openButton = new Button.Small( this.toolbar.width - 28, 0, 24 );
	
	this.getItemsPerRow = function()
	{		
		return Math.max( Math.floor( this.toolbar.width / ( this.itemSize + this.padding ) ), 1 );
	}
	
	this.getInnerHeight = function()
	{
		var rows = Math.ceil( this.items.length / this.getItemsPerRow() );
		var openSize = rows * ( this.itemSize + this.padding );
		
		this.curDelta += Math.max( ( 1.0 - this.curDelta ) / 4.0, 1.0 / openSize );
		
		if( this.curDelta > 1.0 )
			this.curDelta = 1.0;
		
		var delta = this.curDelta;
		
		if( !this.isOpen )
			delta = 1.0 - delta;
			
		return Math.round( openSize * delta );
	}
	
	this.addItem = function( item )
	{
		this.items.push( item );
	}
	
	this.open = function()
	{
		if( !this.isOpen )
		{
			this.curDelta = 0.0;
			this.isOpen = true;
		}
	}
	
	this.close = function()
	{
		if( this.isOpen )
		{
			this.curDelta = 0.0;
			this.isOpen = false;
		}
	}
	
	this.mouseMove = function( x, y )
	{
		this.openButton.mouseMove( x, y );
	}
	
	this.mouseDown = function( x, y )
	{
		if( this.openButton.isPositionOver( x, y ) )
		{
			if( this.isOpen )
				this.close();
			else
				this.open();
		}
		else
		{
			var ipr = this.getItemsPerRow();
			for( var i = 0; i < this.items.length; ++i )
			{
				var imgX = ( i % ipr ) * ( this.itemSize + this.padding )
					+ this.padding / 2;
				var imgY = Math.floor( i / ipr ) * ( this.itemSize + this.padding ) + this.y + 24
					+ this.padding / 2;
					
				if( x >= imgX && y >= imgY && x < imgX + this.itemSize && y < imgY + this.itemSize )
				{
					logicSim.startDragging( this.items[ i ] );
					break;
				}
			}
		}
	}
	
	this.mouseUp = function( x, y )
	{
		
	}
	
	this.click = function( x, y )
	{
	
	}
	
	this.render = function( context )
	{
		context.translate( 0, this.y );
		
		context.fillStyle = context.createPattern( this.toolbar.sepimage.mid, "repeat-x" );
		context.fillRect( 1, 0, this.toolbar.width - 2, 24 );
		
		context.drawImage( this.toolbar.sepimage.end, 0, 0 );
		context.drawImage( this.toolbar.sepimage.end, this.toolbar.width - 2, 0 );
		
		context.translate( 0, -this.y );
		
		this.openButton.y = this.y + 4;
		this.openButton.image = this.isOpen ? this.toolbar.arrimage.up : this.toolbar.arrimage.down;
		this.openButton.render( context );
		
		context.translate( 0, this.y );
		
		context.fillStyle = "#FFFFFF";
		context.font = "bold 12px sans-serif";
		context.shadowOffsetX = 2;
		context.shadowOffsetY = -2;
		context.shadowColor = "#EEEEEE";
		context.fillText( this.name, 4, 16, this.toolbar.width - 8 );
		
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		
		context.translate( 0, -this.y );
		
		if( this.isOpen && this.curDelta > 0.9 )
		{
			var ipr = this.getItemsPerRow();
			
			for( var i = 0; i < this.items.length; ++i )
			{
				var imgX = ( i % ipr ) * ( this.itemSize + this.padding )
					+ ( this.itemSize + this.padding ) / 2;
				var imgY = Math.floor( i / ipr ) * ( this.itemSize + this.padding ) + this.y + 24
					+ ( this.itemSize + this.padding ) / 2;
				
				this.items[ i ].render( context, imgX, imgY );
			}
		}
		
		return 24 + this.getInnerHeight();
	}
}