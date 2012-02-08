Array.prototype.contains = function( obj )
{
    var i = this.length;
    while ( --i >= 0 )
        if ( this[ i ] === obj )
            return true;
			
    return false;
}

Array.prototype.containsEqual = function( obj )
{
    var i = this.length;
    while ( --i >= 0 )
        if ( this[ i ].equals( obj ) )
            return true;
			
    return false;
}

var images = new Object();
images.myToLoadCount = 0;
images.onAllLoaded = function(){}

images.onImageLoad = function()
{	
	--images.myToLoadCount;
	
	if( images.myToLoadCount == 0 )
		images.onAllLoaded();
}

images.load = function( path )
{
	++images.myToLoadCount;
	var img = new Image();
	img.src = path;
	
	img.onload = images.onImageLoad;
	
	return img;
}

images.allImagesLoaded = function()
{
	return ( myToLoadCount == 0 );
}

function Rect( x, y, width, height )
{
	this.x = x;
	this.y = y;
	
	this.width = width;
	this.height = height;
	
	this.left = x;
	this.top = y;
	this.right = x + width;
	this.bottom = y + height;
	
	this.intersects = function( rect )
	{
		return this.left < rect.right && rect.left < this.right
			&& this.top < rect.bottom && rect.top < this.bottom;
	}
}

function Pos( x, y )
{
	this.x = x;
	this.y = y;
	
	this.add = function( pos )
	{
		return new Pos( this.x + pos.x, this.y + pos.y );
	}
	
	this.sub = function( pos )
	{
		return new Pos( this.x - pos.x, this.y - pos.y );
	}
	
	this.equals = function( pos )
	{
		return this.x == pos.x && this.y == pos.y;
	}
}