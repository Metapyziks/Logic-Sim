function Wire(start, end)
{
	var myStartConns = new Array();
	var myEndConns = new Array();
	
	this.group = null;
	
	this.start = new Pos(start.x, start.y);
	this.end = new Pos(end.x, end.y);

	this.selected = false;
	
	if (this.start.x > this.end.x || this.start.y > this.end.y)
	{
		var temp = this.start;
		this.start = this.end;
		this.end = temp;
	}
	
	this.clone = function()
	{
		return new Wire(this.start, this.end);		
	}

	this.equals = function(wire)
	{
		return wire.start.equals(this.start) && wire.end.equals(this.end);
	}

	this.render = function(context, offset, selectClr)
	{
		if (this.selected)
		{
			if (selectClr == null) selectClr = "#6666FF";

			context.globalAlpha = 0.5;
			context.fillStyle = selectClr;
			context.fillRect(this.start.x + offset.x - 4, this.start.y + offset.y - 4,
				this.end.x - this.start.x + 8, this.end.y - this.start.y + 8);
			context.globalAlpha = 1.0;
		}

		context.strokeStyle = "#000000";
		context.lineWidth = 2;
		
		context.beginPath();
		context.moveTo(this.start.x + offset.x, this.start.y + offset.y);
		context.lineTo(this.end.x + offset.x, this.end.y + offset.y);
		context.stroke();
		context.closePath();
		
		context.fillStyle = "#000000";
		
		if (myStartConns.length > 1) {
			context.beginPath();
			context.arc(this.start.x + offset.x, this.start.y + offset.y, 3, 0, Math.PI * 2, true);
			context.fill();
			context.closePath();
		}

		if (myEndConns.length > 1) {
			context.beginPath();
			context.arc(this.end.x + offset.x, this.end.y + offset.y, 3, 0, Math.PI * 2, true);
			context.fill();
			context.closePath();
		}
	}
	
	this.getConnections = function()
	{
		return myStartConns.concat(myEndConns);
	}
	
	this.isHorizontal = function()
	{
		return this.start.y == this.end.y;
	}
	
	this.isVertical = function()
	{
		return this.start.x == this.end.x;
	}
	
	this.runsAlong = function(wire)
	{
		return (this.isHorizontal() && wire.isHorizontal()
			&& this.start.y == wire.start.y && this.start.x <= wire.end.x
			&& this.end.x >= wire.start.x)
			|| (this.isVertical() && wire.isVertical()
			&& this.start.x == wire.start.x && this.start.y <= wire.end.y
			&& this.end.y >= wire.start.y);
	}

	this.split = function(wire)
	{		
		if (this.isHorizontal()) {
			if (wire.start.x == this.start.x || wire.start.x == this.end.x) {
				return [];
			}

			var splat = new Wire(new Pos(wire.start.x, this.start.y), this.end);
			splat.group = this.group;
			splat.selected = this.selected;
			this.end = new Pos(wire.start.x, this.start.y);

			return [splat];
		} else {
			if (wire.start.y == this.start.y || wire.start.y == this.end.y) {
				return [];
			}

			var splat = new Wire(new Pos(this.start.x, wire.start.y), this.end);
			splat.group = this.group;
			splat.selected = this.selected;
			this.end = new Pos(this.start.x, wire.start.y);
			
			return [splat];
		}
	}

	this.merge = function(wire)
	{
		this.selected = this.selected || wire.selected;
		
		if (this.isHorizontal()) {
			this.start.x = Math.min(this.start.x, wire.start.x);
			this.end.x   = Math.max(this.end.x,   wire.end.x  );
		} else {
			this.start.y = Math.min(this.start.y, wire.start.y);
			this.end.y   = Math.max(this.end.y,   wire.end.y  );
		}
	}
	
	this.crossesPos = function(pos)
	{
		return (this.isHorizontal() && this.start.y == pos.y
			&& this.start.x <= pos.x && this.end.x >= pos.x)
			|| (this.isVertical() && this.start.x == pos.x
			&& this.start.y <= pos.y && this.end.y >= pos.y);
	}
	
	this.intersects = function(wire)
	{
		return this.start.x <= wire.end.x && this.end.x >= wire.start.x &&
			this.start.y <= wire.end.y && this.end.y >= wire.start.y;
	}
	
	this.crosses = function(wire)
	{
		return this.start.x < wire.end.x && this.end.x > wire.start.x &&
			this.start.y < wire.end.y && this.end.y > wire.start.y;
	}
	
	this.crossPos = function(wire)
	{
		if (this.isVertical() && wire.isHorizontal()) {
			return new Pos(this.start.x, wire.start.y);
		} else {
			return new Pos(wire.start.x, this.start.y);
		}
	}
	
	this.canConnect = function(wire)
	{
		return !myStartConns.contains(wire) && !myEndConns.contains(wire)
			&& this.intersects(wire) && !this.crosses(wire);
	}

	this.hasConnection = function(pos)
	{
		if (pos.equals(this.start)) {
			return myStartConns.length > 0;
		}

		if (pos.equals(this.end)) {
			return myEndConns.length > 0;
		}

		return false;
	}
	
	this.connect = function(wire)
	{
		if (wire == this) return;

		var conns = myStartConns;

		if (this.end.equals(wire.start) || this.end.equals(wire.end)) {
			conns = myEndConns;
		}

		if (!conns.contains(wire)) {
			conns.push(wire);
		}
	}
	
	this.disconnect = function(wire)
	{
		var index = myConnections.indexOf(wire);
		myConnections.splice(index, 1);
	}
	
	this.toString = function()
	{
		return "(" + this.start.x + "," + this.start.y + ":" + this.end.x + "," + this.end.y + ")";
	}
}