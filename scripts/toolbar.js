function Toolbar()
{
	this.sepimage = new Object();
	this.sepimage.end = new Image();
	this.sepimage.end.src = "images/sepend.png";
	this.sepimage.mid = new Image();
	this.sepimage.mid.src = "images/sepmid.png";
	
	this.btnimage = new Object();
	this.btnimage.expand = new Image();
	this.btnimage.expand.src = "images/btndown.png";
	this.btnimage.contract = new Image();
	this.btnimage.contract.src = "images/btnup.png";

	this.width = 256;
	this.open = true;
	
	this.groups = new Array();
	
	this.addGroup = function( name )
	{
		this.groups.push( new ToolbarGroup( name ) );
	};
	
	this.render = function( context )
	{
		context.fillStyle = "#FFFFFF";
		context.fillRect( 0, 0, this.width, window.innerHeight );
		
		for( var i = 0; i < this.groups.length; ++ i )
		{
			this.renderSeparator( context, true, this.groups[ i ].name, i * 24 );
		}
		
		context.fillStyle = "#000000";
		context.fillRect( this.width - 1, 0, 1, window.innerHeight );
	};
	
	this.renderSeparator = function( context, open, text, yPos )
	{
		context.fillStyle = context.createPattern( this.sepimage.mid, "repeat" );
		context.fillRect( 1, yPos, this.width - 2, 24 );
		
		context.drawImage( this.sepimage.end, 0, yPos );
		context.drawImage( this.sepimage.end, this.width - 2, yPos );
		
		context.drawImage( open ? this.btnimage.contract : this.btnimage.expand, this.width - 29, yPos + 3 );
		
		context.fillStyle = "#FFFFFF";
		context.font = "bold 12px sans-serif";
		context.shadowOffsetX = 2;
		context.shadowOffsetY = -2;
		context.shadowColor = "#EEEEEE";
		context.fillText( text, 4, yPos + 16, this.width - 8 );
		
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
	};
}

function ToolbarGroup( name )
{
	this.name = name;
	this.items = new Array();
	
	this.addItem = function( item )
	{
		this.items.push( item );
	};
}