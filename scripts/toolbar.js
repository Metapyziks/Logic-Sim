function Toolbar()
{
	this.sepimage = new Object();
	this.sepimage.end = images.load( "images/sepend.png" );
	this.sepimage.mid = images.load( "images/sepmid.png" );
	
	this.btnimage = new Object();
	this.btnimage.expand = images.load( "images/btndown.png" );
	this.btnimage.contract = images.load( "images/btnup.png" );

	this.width = 256;
	this.open = true;
	
	this.groups = new Array();
	
	this.addGroup = function( name )
	{
		this.groups.push( new ToolbarGroup( this, name ) );
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
}

function ToolbarGroup( toolbar, name )
{
	this.toolbar = toolbar;

	this.name = name;
	this.items = new Array();
	
	this.open = true;
	
	this.addItem = function( item )
	{
		this.items.push( item );
	}
	
	this.render = function( context, yPos )
	{
		context.translate( 0, yPos );
		
		context.fillStyle = context.createPattern( this.toolbar.sepimage.mid, "repeat-x" );
		context.fillRect( 1, 0, this.toolbar.width - 2, 24 );
		
		context.drawImage( this.toolbar.sepimage.end, 0, 0 );
		context.drawImage( this.toolbar.sepimage.end, this.toolbar.width - 2, 0 );
		
		context.drawImage( this.open ? this.toolbar.btnimage.contract : this.toolbar.btnimage.expand,
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
		
		return 24 + 32;
	}
}