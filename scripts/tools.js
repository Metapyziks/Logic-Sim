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