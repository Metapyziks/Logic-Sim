Button = new Object();
Button.images = new Object();
Button.images.small = new Object();
Button.images.small.up = new Object();
Button.images.small.up.left = images.load( "images/btnsmallleft.png" );
Button.images.small.up.mid = images.load( "images/btnsmallmid.png" );
Button.images.small.up.right = images.load( "images/btnsmallright.png" );
Button.images.small.over = new Object();
Button.images.small.over.left = images.load( "images/btnsmallleftover.png" );
Button.images.small.over.mid = images.load( "images/btnsmallmidover.png" );
Button.images.small.over.right = images.load( "images/btnsmallrightover.png" );

Button.Base = function( x, y, width, height, upImages, overImages, contents )
{
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	
	this.upImages = upImages;
	this.overImages = overImages;
	
	this.text  = ( typeof( contents ) == "string" ? contents : "" );
	this.image = ( typeof( contents ) == "string" ? null : contents );
	
	this.mouseOver = false;
	
	this.isPositionOver = function( posX, posY )
	{
		return posX >= this.x && posY >= this.y
			&& posX < this.x + this.width && posY < this.y + this.height;
	}
	
	this.mouseMove = function( mouseX, mouseY )
	{
		this.mouseOver = this.isPositionOver( mouseX, mouseY );
	}
	
	this.render = function( context )
	{
		context.translate( this.x, this.y );
		
		var imgs = this.mouseOver ? this.overImages : this.upImages;
		context.drawImage( imgs[ 0 ], 0, 0 );
		context.fillStyle = context.createPattern( imgs[ 1 ], "repeat-x" );
		context.fillRect( 1, 0, this.width - 2, this.height );
		context.drawImage( imgs[ 2 ], this.width - 1, 0 );
		
		if( this.image )
			context.drawImage( this.image, ( this.width - this.image.width ) / 2,
				( this.height - this.image.height ) / 2 );
		else
		{
		}
			
		context.translate( -this.x, -this.y );
	}
}

Button.Small = function( x, y, width, contents )
{
	this.__proto__ = new Button.Base( x, y, width, 16,
		[ Button.images.small.up.left, Button.images.small.up.mid, Button.images.small.up.right ],
		[ Button.images.small.over.left, Button.images.small.over.mid, Button.images.small.over.right ],
		contents );
}