function Toolbar()
{
	this.sepimage = new Object();
	this.sepimage.end = images.load( "images/sepend.png" );
	this.sepimage.mid = images.load( "images/sepmid.png" );
	
	this.btnimage = new Object();
	this.btnimage.expand = images.load( "images/btndown.png" );
	this.btnimage.contract = images.load( "images/btnup.png" );

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
			yPos += this.groups[ i ].render( context, yPos );
		}
		
		context.fillStyle = "#000000";
		context.fillRect( this.width - 1, 0, 1, window.innerHeight );
	}
	
	this.onClick = function( x, y )
	{
		var yPos = 0;
		for( var i = 0; i < this.groups.length; ++ i )
		{
			var height = this.groups[ i ].getInnerHeight() + 24;
			
			if( y < yPos + height )
			{
				this.groups[ i ].onClick( x, y - yPos );
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
	
	this.isOpen = true;
	this.actionTime = new Date().getTime();
	
	this.getInnerHeight = function()
	{
		var openSize = 128;
		var delay = 500.0;
		var delta = Math.min( delay, new Date().getTime() - this.actionTime ) / delay;
		delta *= delta;
		if( !this.isOpen )
			delta = 1.0 - delta;
		return Math.round( openSize * delta );
	}
	
	this.getIsMouse
	
	this.addItem = function( item )
	{
		this.items.push( item );
	}
	
	this.open = function()
	{
		if( !this.isOpen )
		{
			this.actionTime = new Date().getTime();
			this.isOpen = true;
		}
	}
	
	this.close = function()
	{
		if( this.isOpen )
		{
			this.actionTime = new Date().getTime();
			this.isOpen = false;
		}
	}
	
	this.onClick = function( x, y )
	{
		if( y < 24 )
		{
			if( this.isOpen )
				this.close();
			else
				this.open();
		}
	}
	
	this.render = function( context, yPos )
	{
		context.translate( 0, yPos );
		
		context.fillStyle = context.createPattern( this.toolbar.sepimage.mid, "repeat-x" );
		context.fillRect( 1, 0, this.toolbar.width - 2, 24 );
		
		context.drawImage( this.toolbar.sepimage.end, 0, 0 );
		context.drawImage( this.toolbar.sepimage.end, this.toolbar.width - 2, 0 );
		
		context.drawImage( this.isOpen ? this.toolbar.btnimage.contract : this.toolbar.btnimage.expand,
			this.toolbar.width - 28, 4 );
		
		context.fillStyle = "#FFFFFF";
		context.font = "bold 12px sans-serif";
		context.shadowOffsetX = 2;
		context.shadowOffsetY = -2;
		context.shadowColor = "#EEEEEE";
		context.fillText( this.name, 4, 16, this.toolbar.width - 8 );
		
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		
		context.translate( 0, -yPos );
		
		return 24 + this.getInnerHeight();
	}
}