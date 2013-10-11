function LogicSim()
{
	var myIsDragging = false;
	var myDraggedGate = null;
	
	var myIsWiring = false;
	var myWireStart = null;
	
	var myGridSize = 8;
	var myGridImage = null;
	
	var myDeleteDown = false;

	this.canvas = null;
	this.context = null;
	
	this.toolbar = null;
	
	this.mouseX = 0;
	this.mouseY = 0;
	
	this.mosueDownPos = null;
	
	this.gates = new Array();
	this.wireGroups = new Array();
	
	this.initialize = function()
	{
		this.canvas = document.getElementById("canvas");
		this.context = this.canvas.getContext("2d");
		
		this.toolbar = new Toolbar();
		var def = this.toolbar.addGroup("Logic Gates");
		def.addItem(new BufferGate());
		def.addItem(new AndGate());
		def.addItem(new OrGate());
		def.addItem(new XorGate());
		def.addItem(new NotGate());
		def.addItem(new NandGate());
		def.addItem(new NorGate());
		def.addItem(new XnorGate());
		var inp = this.toolbar.addGroup("Input");
		inp.addItem(new ConstInput());
		inp.addItem(new ClockInput());
		inp.addItem(new ToggleSwitch());
		inp.addItem(new PushSwitchA());
		inp.addItem(new PushSwitchB());
		var out = this.toolbar.addGroup("Output");
		out.addItem(new OutputDisplay());
		out.addItem(new SevenSegDisplay());
		
		this.changeGridSize(16);

		Saving.load();
		
		this.onResizeCanvas();
	}
	
	this.clear = function()
	{
		this.gates = new Array();
		this.wireGroups = new Array();
	}
	
	this.startDragging = function(gateType)
	{
		myIsDragging = true;
		myDraggedGate = new Gate(gateType, this.mouseX, this.mouseY);
	}
	
	this.getDraggedPosition = function()
	{
		var pos = new Pos(this.mouseX - myDraggedGate.width / 2,
			this.mouseY - myDraggedGate.height / 2);
		
		pos.x = Math.round(pos.x / myGridSize) * myGridSize;
		pos.y = Math.round(pos.y / myGridSize) * myGridSize;
		
		return pos;
	}
	
	this.stopDragging = function()
	{
		if(this.mouseX >= 256)
		{
			var pos = this.getDraggedPosition();
			
			myDraggedGate.x = pos.x;
			myDraggedGate.y = pos.y;
			
			if(this.getCanPlace())
				this.placeGate(myDraggedGate);
		}
		
		myIsDragging = false;
		myDraggedGate = null;
	}
	
	this.placeGate = function(gate)
	{
		var r0 = gate.getRect(myGridSize);
	
		for(var i = 0; i < this.gates.length; ++ i)
		{
			var other = this.gates[i];
			var r1 = other.getRect(myGridSize);
			
			if(r0.left == r1.right || r1.left == r0.right
				|| r0.top == r1.bottom || r1.top == r0.bottom)
			{				
				for(var j = 0; j < gate.inputs.length; ++ j)
				{
					var inp = gate.inputs[j];
					for(var k = 0; k < other.outputs.length; ++ k)
					{
						var out = other.outputs[k];
						
						if(inp.getPosition(gate.type, gate.x, gate.y).equals(
							out.getPosition(other.type, other.x, other.y)))
							gate.linkInput(other, out, inp);
					}
				}
				
				for(var j = 0; j < gate.outputs.length; ++ j)
				{
					var out = gate.outputs[j];
					for(var k = 0; k < other.inputs.length; ++ k)
					{
						var inp = other.inputs[k];
						
						if(out.getPosition(gate.type, gate.x, gate.y).equals(
							inp.getPosition(other.type, other.x, other.y)))
							other.linkInput(gate, out, inp);
					}
				}
			}
		}
		
		for(var i = 0; i < this.wireGroups.length; ++ i)
		{
			var group = this.wireGroups[i];
					
			for(var j = 0; j < gate.inputs.length; ++ j)
			{
				var pos = gate.inputs[j].getPosition(gate.type, gate.x, gate.y);
				
				if(group.crossesPos(pos))
					group.addOutput(gate, gate.inputs[j]);
			}
			
			for(var j = 0; j < gate.outputs.length; ++ j)
			{
				var pos = gate.outputs[j].getPosition(gate.type, gate.x, gate.y);
				
				if(group.crossesPos(pos))
					group.setInput(gate, gate.outputs[j]);
			}
		}
		
		this.gates.push(gate);
	}
	
	this.removeGate = function(gate)
	{
		var index = this.gates.indexOf(gate);
		this.gates.splice(index, 1);
		
		for(var i = 0; i < this.gates.length; ++ i)
		{
			if(this.gates[i].isLinked(gate))
				this.gates[i].unlinkGate(gate);
			if(gate.isLinked(this.gates[i]))
				gate.unlinkGate(this.gates[i]);
		}
		
		for(var i = 0; i < this.wireGroups.length; ++ i)
		{
			var group = this.wireGroups[i];
			if(group.input != null && group.input.gate == gate)
				group.input = null;
				
			for(var j = group.outputs.length - 1; j >= 0; -- j)
				if(group.outputs[j].gate == gate)
					group.outputs.splice(j, 1);
		}
	}
	
	this.getCanPlace = function()
	{
		if(!myIsDragging)
			return false;
		
		var gate = myDraggedGate;		
		var rect = myDraggedGate.getRect();
		
		for(var i = 0; i < this.gates.length; ++i)
		{
			var other = this.gates[i].getRect();
			
			if(rect.intersects(other))
				return false;
		}
		
		var crossed = false;
		
		for(var i = 0; i < this.wireGroups.length; ++ i)
		{
			var group = this.wireGroups[i];
			for(var j = 0; j < gate.outputs.length; ++ j)
			{
				var out = gate.outputs[j];
				if(group.crossesPos(out.getPosition(gate.type, gate.x, gate.y)))
				{
					if(crossed || group.input != null)
						return false;
					
					crossed = true;
				}
			}
		}
		
		return true;
	}
	
	this.startWiring = function(x, y)
	{
		var snap = 8;
	
		myIsWiring = true;
		myWireStart = new Pos(
			Math.round(x / snap) * snap,
			Math.round(y / snap) * snap
		);
	}
	
	this.stopWiring = function(x, y)
	{
		if(this.canPlaceWire())
			this.placeWire(myWireStart, this.getWireEnd());
		
		myIsWiring = false;
	}
	
	this.getWireEnd = function()
	{
		var snap = 8;
		
		var pos = new Pos(
			Math.round(this.mouseX / snap) * snap,
			Math.round(this.mouseY / snap) * snap
		);
		
		var diff = pos.sub(myWireStart);
		
		if(Math.abs(diff.x) >= Math.abs(diff.y))
			pos.y = myWireStart.y;
		else
			pos.x = myWireStart.x;
			
		return pos;
	}
	
	this.canPlaceWire = function()
	{
		var end = this.getWireEnd();
		
		if(myWireStart.equals(end))
			return false;
			
		var wire = new Wire(myWireStart, end);
		var input = null;
		
		for(var i = 0; i < this.wireGroups.length; ++ i)
		{
			var group = this.wireGroups[i];
			
			if(group.canAddWire(wire) && group.input != null)
			{
				if(input != null && !group.input.equals(input))
					return false;
				
				input = group.input;
			}
		}
		
		for(var i = 0; i < this.gates.length; ++ i)
		{
			var gate = this.gates[i];
			var rect = gate.getRect(myGridSize);
			
			if(wire.start.x == rect.right || rect.left == wire.end.x
				|| wire.start.y == rect.bottom || rect.top == wire.end.y)
			{
				for(var j = 0; j < gate.outputs.length; ++ j)
				{
					var inp = new Link(gate, gate.outputs[j]);
					var pos = gate.outputs[j].getPosition(gate.type, gate.x, gate.y);
					
					if(wire.crossesPos(pos))
					{
						if(input != null && !inp.equals(input))
							return false;
						
						input = inp;
					}
				}
			}
		}
		
		return true;
	}
	
	this.placeWire = function(start, end)
	{
		var wire = new Wire(start, end);
		
		for(var i = 0; i < this.gates.length; ++ i)
		{
			var gate = this.gates[i];
			var rect = gate.getRect(myGridSize);
			
			if(wire.start.x == rect.right || rect.left == wire.end.x
				|| wire.start.y == rect.bottom || rect.top == wire.end.y)
			{				
				for(var j = 0; j < gate.inputs.length; ++ j)
				{
					var pos = gate.inputs[j].getPosition(gate.type, gate.x, gate.y);
					
					if(wire.crossesPos(pos))
						wire.group.addOutput(gate, gate.inputs[j]);
				}
				
				for(var j = 0; j < gate.outputs.length; ++ j)
				{
					var pos = gate.outputs[j].getPosition(gate.type, gate.x, gate.y);
					
					if(wire.crossesPos(pos))
						wire.group.setInput(gate, gate.outputs[j]);
				}
			}
		}
	
		for(var i = 0; i < this.wireGroups.length; ++ i)
		{
			var group = this.wireGroups[i];
			if(group.canAddWire(wire))
				group.addWire(wire);
		}
		
		for(var i = this.wireGroups.length - 1; i >= 0; --i)
			if(this.wireGroups[i].isEmpty)
				this.wireGroups.splice(i, 1);
		
		if(!this.wireGroups.contains(wire.group))
			this.wireGroups.push(wire.group);
	}
	
	this.removeWire = function(wire)
	{
		this.removeWireGroup(wire.group);
		
		var wires = wire.group.getWires();
		
		for(var i = 0; i < wires.length; ++ i)
		{
			var w = wires[i];
			if(w != wire)
				this.placeWire(w.start, w.end);
		}
	}
	
	this.removeWireGroup = function(group)
	{
		var gindex = this.wireGroups.indexOf(group);
		this.wireGroups.splice(gindex, 1);
		
		group.removeAllOutputs();
		group.removeInput();
	}
	
	this.mouseMove = function(x, y)
	{
		this.mouseX = x;
		this.mouseY = y;
		
		this.toolbar.mouseMove(x, y);
		
		if(myIsDragging)
		{
			var pos = this.getDraggedPosition();
			myDraggedGate.x = pos.x;
			myDraggedGate.y = pos.y;
		}
		else if(!myIsDragging && myDraggedGate != null && myDraggedGate.isMouseDown)
		{
			var pos = new Pos(x, y);
			var gate = myDraggedGate;
			var rect = new Rect(gate.x, gate.y, gate.width, gate.height);
			
			if(!rect.contains(pos))
			{
				gate.mouseUp();
				this.removeGate(gate);
				myIsDragging = true;
			}
		}
	}
	
	this.mouseDown = function(x, y)
	{
		this.mouseX = x;
		this.mouseY = y;
		
		this.mouseDownPos = new Pos(x, y);
		
		if(x < 256)
			this.toolbar.mouseDown(x, y);
		else
		{
			var pos = new Pos(x, y);
		
			for(var i = 0; i < this.gates.length; ++ i)
			{
				var gate = this.gates[i];
				var rect = new Rect(gate.x + 8, gate.y + 8, gate.width - 16, gate.height - 16);
				
				if(rect.contains(pos))
				{
					myDraggedGate = gate;
					gate.mouseDown();
					return;
				}
			}
			
			if(!myDeleteDown)
				this.startWiring(x, y);
		}
	}
	
	this.mouseUp = function(x, y)
	{
		this.mouseX = x;
		this.mouseY = y;
		
		if(myIsDragging)
			this.stopDragging();
		else if(myIsWiring)
			this.stopWiring();
		else if(x < 256)
			this.toolbar.mouseUp(x, y);
		else
		{
			var pos = new Pos(x, y);
			
			var deleted = false;
		
			for(var i = 0; i < this.gates.length; ++ i)
			{
				var gate = this.gates[i];
				
				if(gate.isMouseDown)
				{
					var rect = new Rect(gate.x + 8, gate.y + 8, gate.width - 16, gate.height - 16);
					
					if(rect.contains(pos))
					{
						if(myDeleteDown && !deleted)
						{
							this.removeGate(gate);
							deleted = true;
						}
						else
							gate.click();
					}
					
					gate.mouseUp();
				}
			}
			
			if(myDeleteDown && !deleted)
			{
				var gsize = 8;
				this.mouseDownPos.x = Math.round(this.mouseDownPos.x / gsize) * gsize;
				this.mouseDownPos.y = Math.round(this.mouseDownPos.y / gsize) * gsize;
				pos.x = Math.round(pos.x / gsize) * gsize;
				pos.y = Math.round(pos.y / gsize) * gsize;
				
				if(this.mouseDownPos.equals(pos))
				{
					for(var i = 0; i < this.wireGroups.length; ++ i)
					{
						var group = this.wireGroups[i];
						if(group.crossesPos(pos))
						{
							var wire = group.getWireAt(pos);
							this.removeWire(wire);
							break;
						}
					}
				}
			}
		}
	}
	
	this.click = function(x, y)
	{
		this.mouseX = x;
		this.mouseY = y;
		
		if(x < 256)
			this.toolbar.click(x, y);
	}
	
	this.keyDown = function(e)
	{
		if(e.keyCode == 46)
		{
			myDeleteDown = true;
			
			myIsDragging = false;
			myDraggedGate = null;
		}

		if (e.keyCode == 83 && e.ctrlKey)
		{
			Saving.save();
			e.preventDefault();
		}
	}
	
	this.keyUp = function(e)
	{
		if(e.keyCode == 46)
			myDeleteDown = false;
	}
	
	this.changeGridSize = function(size)
	{
		myGridSize = size;
		myGridImage = document.createElement("canvas");
		myGridImage.width = myGridSize * 2;
		myGridImage.height = myGridSize * 2;
		
		var context = myGridImage.getContext("2d");
		
		context.fillStyle = "#CCCCCC";
		context.fillRect(0, 0, myGridSize * 2, myGridSize * 2);
		context.fillStyle = "#DDDDDD";
		context.fillRect(0, 0, myGridSize, myGridSize);
		context.fillRect(myGridSize, myGridSize, myGridSize, myGridSize);
	}

	this.onResizeCanvas = function()
	{
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}

	this.render = function()
	{
		this.context.fillStyle = this.context.createPattern(myGridImage, "repeat");
		this.context.fillRect(256, 0, this.canvas.width - 256, this.canvas.height);
		
		for(var i = 0; i < this.wireGroups.length; ++ i)
			this.wireGroups[i].render(this.context);
			
		for(var i = 0; i < this.gates.length; ++ i)
			this.gates[i].render(this.context);
		
		this.toolbar.render(this.context);
		
		if(myIsDragging)
		{			
			if(!this.getCanPlace())
			{
				var rect = myDraggedGate.getRect(myGridSize);
				this.context.globalAlpha = 0.25;
				this.context.fillStyle = "#FF0000";
				this.context.fillRect(rect.left, rect.top, rect.width, rect.height);
				this.context.globalAlpha = 1.0;
			}
			
			myDraggedGate.render(this.context);
		}
		else if(myIsWiring)
		{		
			var end = this.getWireEnd();
		
			this.context.strokeStyle = this.canPlaceWire() ? "#009900" : "#990000";
			this.context.lineWidth = 2;
			this.context.beginPath();
			this.context.moveTo(myWireStart.x, myWireStart.y);
			this.context.lineTo(end.x, end.y);
			this.context.stroke();
			this.context.closePath();
		}
	}
	
	this.run = function()
	{
		setInterval(this.mainLoop, 1000.0 / 60.0, this);
	}
	
	this.mainLoop = function(self)
	{
		for(var i = 0; i < self.gates.length; ++ i)
			self.gates[i].step();
			
		for(var i = 0; i < self.gates.length; ++ i)
			self.gates[i].commit();
			
		self.render();
	}
}

logicSim = new LogicSim();

window.onload = function(e)
{
	if(!images.allImagesLoaded())
	{
		images.onAllLoaded = function()
		{
			logicSim.initialize();
			logicSim.run();
		}
	}
	else
	{
		logicSim.initialize();
		logicSim.run();
	}
}

window.onmousemove = function(e)
{
	if(e)
		logicSim.mouseMove(e.pageX, e.pageY);
	else
		logicSim.mouseMove(window.event.clientX, window.event.clientY);
}

window.onmousedown = function(e)
{
	if(e)
		logicSim.mouseDown(e.pageX, e.pageY);
	else
		logicSim.mouseDown(window.event.clientX, window.event.clientY);
}

window.onmouseup = function(e)
{
	if(e)
		logicSim.mouseUp(e.pageX, e.pageY);
	else
		logicSim.mouseUp(window.event.clientX, window.event.clientY);
}

window.onclick = function(e)
{
	if(e)
		logicSim.click(e.pageX, e.pageY);
	else
		logicSim.click(window.event.clientX, window.event.clientY);
}

window.onkeydown = function(e)
{
	logicSim.keyDown(e);
}

window.onkeyup = function(e)
{
	logicSim.keyUp(e);
}

function onResizeCanvas()
{
	logicSim.onResizeCanvas();
}