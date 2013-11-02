Array.prototype.contains = function(obj)
{
    var i = this.length;
    while (--i >= 0)
        if (this[i] === obj)
            return true;
			
    return false;
}

Array.prototype.pushMany = function(arr)
{
    for (var i = 0; i < arr.length; ++i) {
    	this.push(arr[i]);
    }
}

Array.prototype.containsEqual = function(obj)
{
    var i = this.length;
    while (--i >= 0)
        if (this[i].equals(obj))
            return true;
			
    return false;
}

var images = new Object();
images.myToLoadCount = 0;
images.onAllLoaded = function() {}

images.onImageLoad = function()
{	
	--images.myToLoadCount;
	
	if(images.myToLoadCount == 0)
		images.onAllLoaded();
}

images.load = function(path)
{
	++images.myToLoadCount;
	var img = new Image();
	img.src = "images/" + path;
	
	img.onload = images.onImageLoad;
	
	images[path.substring(0, path.length - 4)] = img;
	return img;
}

images.allImagesLoaded = function()
{
	return (images.myToLoadCount == 0);
}

images.load("and.png");
images.load("arrdown.png");
images.load("arrup.png");
images.load("btnsmallleft.png");
images.load("btnsmallleftover.png");
images.load("btnsmallmid.png");
images.load("btnsmallmidover.png");
images.load("btnsmallright.png");
images.load("btnsmallrightover.png");
images.load("buffer.png");
images.load("clock.png");
images.load("constoff.png");
images.load("conston.png");
images.load("decoder.png");
images.load("delete.png");
images.load("delic.png");
images.load("dflipflop.png");
images.load("encoder.png");
images.load("input.png");
images.load("move.png");
images.load("nand.png");
images.load("newfile.png");
images.load("newic.png");
images.load("nor.png");
images.load("not.png");
images.load("open.png");
images.load("or.png");
images.load("outoff.png");
images.load("outon.png");
images.load("output.png");
images.load("pushswitchaclosed.png");
images.load("pushswitchaopen.png");
images.load("pushswitchbclosed.png");
images.load("pushswitchbopen.png");
images.load("save.png");
images.load("select.png");
images.load("sepend.png");
images.load("sepmid.png");
images.load("sevsega.png");
images.load("sevsegb.png");
images.load("sevsegbase.png");
images.load("sevsegc.png");
images.load("sevsegd.png");
images.load("sevsegdecoder.png");
images.load("sevsegdp.png");
images.load("sevsege.png");
images.load("sevsegf.png");
images.load("sevsegg.png");
images.load("switchclosed.png");
images.load("switchopen.png");
images.load("xnor.png");
images.load("xor.png");

function Rect(x, y, width, height)
{
	this.x = x;
	this.y = y;
	
	this.width = width;
	this.height = height;
	
	this.left = x;
	this.top = y;
	this.right = x + width;
	this.bottom = y + height;

	this.setLeft = function(value)
	{
		this.left = value;
		this.x = value;
		this.width = this.right - value;
	}

	this.setTop = function(value)
	{
		this.top = value;
		this.y = value;
		this.height = this.bottom - value;
	}

	this.setRight = function(value)
	{
		this.right = value;
		this.width = value - this.left;
	}

	this.setBottom = function(value)
	{
		this.bottom = value;
		this.height = value - this.top;
	}
	
	this.intersects = function(rect)
	{
		return this.left < rect.right && rect.left < this.right
			&& this.top < rect.bottom && rect.top < this.bottom;
	}

	this.intersectsWire = function(wire, ends)
	{
		if (ends) {
			return wire.start.x <= this.right && wire.end.x >= this.left
                && wire.start.y <= this.bottom && wire.end.y >= this.top;
		}

		if (wire.isHorizontal()) {
			return wire.start.x < this.right && wire.end.x > this.left
                && wire.start.y <= this.bottom && wire.end.y >= this.top;
		} else {
			return wire.start.x <= this.right && wire.end.x >= this.left
                && wire.start.y < this.bottom && wire.end.y > this.top;
		}
	}
	
	this.contains = function(pos)
	{
		return pos.x >= this.left && pos.x <= this.right
			&& pos.y >= this.top && pos.y <= this.bottom;
	}
}

function Pos(x, y)
{
	this.x = x;
	this.y = y;
	
	this.add = function(pos)
	{
		return new Pos(this.x + pos.x, this.y + pos.y);
	}
	
	this.sub = function(pos)
	{
		return new Pos(this.x - pos.x, this.y - pos.y);
	}
	
	this.equals = function(pos)
	{
		return this.x == pos.x && this.y == pos.y;
	}
	
	this.toString = function()
	{
		return "(" + this.x + "," + this.y + ")";
	}
}