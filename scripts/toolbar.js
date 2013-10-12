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
	
	this.addGroup = function(name, hide)
	{
		var group = new ToolbarGroup(this, name);
		this.groups.push(group);

		if (hide) group.isOpen = false;

		return group;
	}
	
	this.render = function(context)
	{		
		context.fillStyle = "#FFFFFF";
		context.fillRect(0, 0, this.width, window.innerHeight);
		
		var yPos = 0;
		for (var i = 0; i < this.groups.length; ++ i)
		{
			this.groups[i].y = yPos;
			yPos += this.groups[i].render(context);
		}
		
		context.fillStyle = "#000000";
		context.fillRect(this.width - 1, 0, 1, window.innerHeight);
	}
	
	this.mouseMove = function(x, y)
	{
		for (var i = 0; i < this.groups.length; ++ i)
			this.groups[i].mouseMove(x, y);
	}
	
	this.mouseDown = function(x, y)
	{
		var yPos = 0;
		for (var i = 0; i < this.groups.length; ++ i)
		{
			var height = this.groups[i].getInnerHeight() + 24;
			
			if (y < yPos + height)
			{
				this.groups[i].mouseDown(x, y);
				break;
			}
			
			yPos += height;
		}
	}
	
	this.mouseUp = function(x, y)
	{
		var yPos = 0;
		for (var i = 0; i < this.groups.length; ++ i)
		{
			var height = this.groups[i].getInnerHeight() + 24;
			
			if (y < yPos + height)
			{
				this.groups[i].mouseUp(x, y);
				break;
			}
			
			yPos += height;
		}
	}
	
	this.click = function(x, y)
	{
		var yPos = 0;
		for (var i = 0; i < this.groups.length; ++ i)
		{
			var height = this.groups[i].getInnerHeight() + 24;
			
			if (y < yPos + height)
			{
				this.groups[i].click(x, y);
				break;
			}
			
			yPos += height;
		}
	}
}

function ToolbarGroup(toolbar, name)
{
	this.toolbar = toolbar;

	this.name = name;
	this.items = new Array();
	this.buttons = new Array();
	
	this.padding = 16;
	this.minItemWidth = 80;
	
	this.y = 0;
	
	this.isOpen = true;
	this.curDelta = 1.0;
	
	var self = this;

	this.openButton = new Button.Small(0, 0, 24);
	this.openButton.mouseDown = function(mouseX, mouseY)
	{
		if (self.items.length != 0)
		{
			if (self.isOpen)
				self.close();
			else
				self.open();
		}
	}
	this.buttons.push(this.openButton);

	this.getItemsPerRow = function()
	{		
		return Math.max(Math.floor(this.toolbar.width / this.minItemWidth), 1);
	}

	this.getItemWidth = function()
	{
		return this.toolbar.width / this.getItemsPerRow();
	}

	this.getRowCount = function()
	{
		return Math.ceil(this.items.length / this.getItemsPerRow());
	}

	this.getRowHeight = function(row)
	{
		var start = this.getItemsPerRow() * row;
		var end = start + this.getItemsPerRow();

		var height = 0;

		for (var i = start; i < Math.min(end, this.items.length); ++i)
			height = Math.max(height, this.items[i].height);

		return height + this.padding;
	}

	this.getRowOffset = function(row)
	{
		row = Math.min(row, this.getRowCount());
		
		var height = 0;
		for (var i = 0; i < row; ++ i)
			height += this.getRowHeight(i);

		return height;
	}
	
	this.getInnerHeight = function()
	{
		var openSize = this.getRowOffset(this.getRowCount());
		
		this.curDelta += Math.max((1.0 - this.curDelta) / 4.0, 1.0 / openSize);
		
		if (this.curDelta > 1.0)
			this.curDelta = 1.0;
		
		var delta = this.curDelta;
		
		if (!this.isOpen)
			delta = 1.0 - delta;
			
		return Math.round(openSize * delta);
	}
	
	this.addItem = function(item)
	{
		this.items.push(item);
		return item;
	}
	
	this.addButton = function(width, contents, mouseDown)
	{
		var btn = new Button.Small(0, 0, width, contents);
		btn.mouseDown = mouseDown;
		this.buttons.push(btn);
	}

	this.open = function()
	{
		if (!this.isOpen)
		{
			this.curDelta = 0.0;
			this.isOpen = true;
		}
	}
	
	this.close = function()
	{
		if (this.isOpen)
		{
			this.curDelta = 0.0;
			this.isOpen = false;
		}
	}
	
	this.mouseMove = function(x, y)
	{
		for (var i = this.buttons.length - 1; i >= 0; i--)
			this.buttons[i].mouseMove(x, y);
	}
	
	this.mouseDown = function(x, y)
	{
		if (y <= this.y + 24) {
			for (var i = this.buttons.length - 1; i >= 0; i--)
			{
				var btn = this.buttons[i];
				if (btn == this.openButton && this.items.length == 0) continue;
				if (btn.isPositionOver(x, y))
				{
					btn.mouseDown(x, y)
					break;
				}
			}
		} else {
			var ipr = this.getItemsPerRow();
			var wid = this.getItemWidth();
			for (var i = 0; i < this.items.length; ++i)
			{
				var item = this.items[i];
				var row = Math.floor(i / ipr);
				var imgX = (i % ipr) * wid + (wid - item.width) / 2;
				var imgY = this.getRowOffset(row) + this.y + 24
					+ (this.getRowHeight(row) - item.height) / 2;
					
				if (x >= imgX && y >= imgY && x < imgX + item.width && y < imgY + item.height)
				{
					if (item.isGateType)
						logicSim.startDragging(item);
					else
						item.mouseDown(x, y);

					break;
				}
			}
		}
	}
	
	this.mouseUp = function(x, y)
	{
		
	}
	
	this.click = function(x, y)
	{
	
	}
	
	this.render = function(context)
	{
		context.translate(0, this.y);
		
		context.fillStyle = context.createPattern(this.toolbar.sepimage.mid, "repeat-x");
		context.fillRect(1, 0, this.toolbar.width - 2, 24);
		
		context.drawImage(this.toolbar.sepimage.end, 0, 0);
		context.drawImage(this.toolbar.sepimage.end, this.toolbar.width - 2, 0);
		
		context.translate(0, -this.y);

		this.openButton.image = this.isOpen ? this.toolbar.arrimage.up : this.toolbar.arrimage.down;
		
		var btnx = this.toolbar.width;
		for (var i = 0; i < this.buttons.length; ++i)
		{
			var btn = this.buttons[i];
			if (btn == this.openButton && this.items.length == 0) continue;
			btn.y = this.y + 4;
			btnx -= btn.width + 4;
			btn.x = btnx;
			btn.render(context);
		}

		context.translate(0, this.y);
		
		context.fillStyle = "#FFFFFF";
		context.font = "bold 12px sans-serif";
		context.shadowOffsetX = 0;
		context.shadowOffsetY = -1;
		context.shadowColor = "#000000";
		context.fillText(this.name, 4, 16, this.toolbar.width - 8);
		
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		
		context.translate(0, -this.y);
		
		if (this.isOpen && this.curDelta > 0.9)
		{
			var ipr = this.getItemsPerRow();
			var wid = this.getItemWidth();			
			for (var i = 0; i < this.items.length; ++i)
			{
				var item = this.items[i];
				var row = Math.floor(i / ipr);
				var imgX = (i % ipr) * wid + (wid - item.width) / 2;
				var imgY = this.getRowOffset(row) + this.y + 24
					+ (this.getRowHeight(row) - item.height) / 2;
				
				if (item.isGateType)
					item.render(context, Math.round(imgX), imgY);
				else
				{
					item.x = Math.round(imgX);
					item.y = imgY;
					item.render(context);
				}
			}
		}
		
		return 24 + this.getInnerHeight();
	}
}