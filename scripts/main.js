var ControlMode = {
	wiring: 0,
	selecting: 1,
	deleting: 2
};

function LogicSim()
{
	this.__proto__ = new Environment();

	var myIsDragging = false;
	var myIsSelecting = false;
	var myCanDrag = false;
	
	var myIsWiring = false;
	var myWireStart = null;
	
	var myGridSize = 8;
	var myGridImage = null;
	
	var myDeleteBtn = null;
	var mySelectBtn = null;
	var myMoveBtn = null;

	var myCtrlDown = false;

	var mySelection = new Environment();
	var myCanPlace = false;
	var myLastDragPos = null;

	var myCustoms = new Array();

	this.canvas = null;
	this.context = null;
	
	this.toolbar = null;
	
	this.mouseX = 0;
	this.mouseY = 0;
	
	this.mosueDownPos = null;

	this.mode = ControlMode.wiring;
	
	this.initialize = function()
	{
		this.canvas = document.getElementById("canvas");
		this.context = this.canvas.getContext("2d");
		
		this.toolbar = new Toolbar();
		var grp = this.toolbar.addGroup("Tools");
		grp.addItem(new Button.Tool(images.newfile, function() {
			if (confirm("Are you sure you want to delete all existing gates, "
				+ "wires and custom circuits?")) {
				logicSim.clear();
			}
		}));
		grp.addItem(new Button.Tool(images.save, function() {
			Saving.save();
		}));
		grp.addItem(new Button.Tool(images.open, function() {
			Saving.loadFromPrompt();
		}));
		myDeleteBtn = grp.addItem(new Button.Tool(images.delete, function() {
			if (logicSim.mode == ControlMode.deleting)
				logicSim.setMode(ControlMode.wiring);
			else
				logicSim.setMode(ControlMode.deleting);
		}));
		mySelectBtn = grp.addItem(new Button.Tool(images.select, function() {
			if (logicSim.mode == ControlMode.wiring)
				logicSim.setMode(ControlMode.wiring);
			else
				logicSim.setMode(ControlMode.selecting);
		}));
		grp.addItem(new Button.Tool(images.newic, function() {
			if (logicSim.getOutputs().length == 0) {
				alert("At least one output required to create an integrated circuit.");
				return;
			}

			var name = prompt("Please enter a name for the new integrated circuit.", "");
			if (name == null) return;

			logicSim.customGroup.addItem(new CustomIC(name, logicSim.clone()));
		}));

		grp = this.toolbar.addGroup("Logic Gates");
		grp.addItem(new BufferGate());
		grp.addItem(new AndGate());
		grp.addItem(new OrGate());
		grp.addItem(new XorGate());
		grp.addItem(new NotGate());
		grp.addItem(new NandGate());
		grp.addItem(new NorGate());
		grp.addItem(new XnorGate());

		grp = this.toolbar.addGroup("Input");
		grp.addItem(new ConstInput());
		grp.addItem(new ClockInput());
		grp.addItem(new ToggleSwitch());
		grp.addItem(new PushSwitchA());
		grp.addItem(new PushSwitchB());
		grp.addItem(new ICInput());

		grp = this.toolbar.addGroup("Output");
		grp.addItem(new OutputDisplay());
		grp.addItem(new SevenSegDisplay());
		grp.addItem(new ICOutput());

		grp = this.toolbar.addGroup("Flip Flops", true);
		grp.addItem(new DFlipFlop());

		grp = this.toolbar.addGroup("Integrated Circuits", true);
		grp.addItem(new Encoder());
		grp.addItem(new Decoder());
		grp.addItem(new SevenSegDecoder());

		this.customGroup = this.toolbar.addGroup("Custom Circuits");
		
		this.setGridSize(16);
		this.onResizeCanvas();

		Saving.loadFromHash();
	}
		
	this.startDragging = function(gateType)
	{
		mySelection.clear();

		if (gateType != null) {
			this.deselectAll();

			var gate = new Gate(gateType, 0, 0);
			gate.selected = true;

			mySelection.placeGate(gate);
		} else {
			var pos = this.mouseDownPos;

			for (var i = this.gates.length - 1; i >= 0; i--) {
				var gate = this.gates[i];
				if (!gate.selected) continue;

				if (myCtrlDown) {
					gate.selected = false;
					var data = gate.saveData();
					gate = new Gate(gate.type, gate.x, gate.y);
					gate.loadData(data);
					gate.selected = true;
				} else {
					this.removeGate(gate);
				}

				gate.x -= pos.x;
				gate.y -= pos.y;

				mySelection.placeGate(gate);
			}

			var wires = this.getAllWires();
			var toRemove = new Array();
			for (var i = 0; i < wires.length; ++ i) {
				var wire = wires[i];
				if (!wire.selected) continue;

				if (myCtrlDown) {
					wire.selected = false;
				} else {
					toRemove.push(wire);
				}

				mySelection.placeWire(wire.start.sub(pos), wire.end.sub(pos), true);
			}

			if (!myCtrlDown) {
				this.removeWires(toRemove);
			}
		}

		myIsDragging = true;
	}

	this.getDraggedPosition = function()
	{
		var snap = myGridSize / 2;

		for (var i = this.gates.length - 1; i >= 0; i--) {
			var gate = this.gates[i];
			if (gate.selected) {
				snap = myGridSize;
				break;
			}
		}

		if (mySelection.gates.length > 0) {
			snap = myGridSize;
		}

		return new Pos(
			Math.round(this.mouseX / snap) * snap,
			Math.round(this.mouseY / snap) * snap
		);
	}

	this.getSelectedRect = function()
	{
		var start = new Pos(this.mouseDownPos.x, this.mouseDownPos.y);
		var end = this.getDraggedPosition();

		if (end.x < start.x) {
			var temp = end.x;
			end.x = start.x;
			start.x = temp;
		}

		if (end.y < start.y) {
			var temp = end.y;
			end.y = start.y;
			start.y = temp;
		}

		return new Rect(start.x, start.y, end.x - start.x, end.y - start.y);
	}
	
	this.stopDragging = function()
	{
		myIsDragging = false;

		if (this.getDraggedPosition().x >= 256) {
			if (myCanPlace) {
				this.tryMerge(mySelection, this.getDraggedPosition(), true);
			} else {
				this.tryMerge(mySelection, this.mouseDownPos, true);
			}
		}

		mySelection.clear();
	}

	this.setMode = function(mode)
	{
		if (mode == ControlMode.deleting) {
			var deleted = false;
			for (var i = this.gates.length - 1; i >= 0; i--) {
				var gate = this.gates[i];
				if (gate.selected) {
					deleted = true;
					this.removeGate(gate);
				}
			}

			var wires = this.getAllWires();
			var toRemove = new Array();
			for (var i = wires.length - 1; i >= 0; i--) {
				var wire = wires[i];
				if (wire.selected) {
					deleted = true;
					toRemove.push(wire);
				}
			}
			this.removeWires(toRemove);

			if (deleted) mode = ControlMode.wiring;
		}

		this.mode = mode;

		myDeleteBtn.selected = mode == ControlMode.deleting;
		mySelectBtn.selected = mode == ControlMode.selecting;
	}

	this.startWiring = function(x, y)
	{
		var snap = myGridSize / 2;
	
		myIsWiring = true;
		myWireStart = new Pos(
			Math.round(x / snap) * snap,
			Math.round(y / snap) * snap
		);
	}
	
	this.stopWiring = function(x, y)
	{
		if (this.canPlaceWire(new Wire(myWireStart, this.getWireEnd()))) {
			this.deselectAll();
			this.placeWire(myWireStart, this.getWireEnd());
		}

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
		
		if (Math.abs(diff.x) >= Math.abs(diff.y)) {
			pos.y = myWireStart.y;
		} else {
			pos.x = myWireStart.x;
		}

		return pos;
	}
	
	this.mouseMove = function(x, y, e)
	{
		this.mouseX = x;
		this.mouseY = y;

		myCtrlDown = e.ctrlKey;

		if (this.toolbar == null) return;

		if (e.shiftKey) this.setMode(ControlMode.selecting);
		else if (this.mode == ControlMode.selecting) this.setMode(ControlMode.wiring);
		
		this.toolbar.mouseMove(x, y);

		if (!myIsDragging && !myIsSelecting && myCanDrag && this.mouseDownPos != null) {
			var diff = new Pos(x, y).sub(this.mouseDownPos);
			if (Math.abs(diff.x) >= 8 || Math.abs(diff.y) >= 8)
				this.startDragging();
		} else if (myIsDragging) {
			var pos = this.getDraggedPosition();

			if (myLastDragPos == null || !pos.equals(myLastDragPos)) {
				var env = this.clone();
				myCanPlace = env.tryMerge(mySelection, pos, false, true);
				myLastDragPos = pos;
			}
		}
	}
	
	this.mouseDown = function(x, y, e)
	{
		this.mouseX = x;
		this.mouseY = y;

		myCtrlDown = e.ctrlKey;

		if (this.toolbar == null) return;

		if (e.shiftKey) this.setMode(ControlMode.selecting);
		else if (this.mode == ControlMode.selecting) this.setMode(ControlMode.wiring);
		
		this.mouseDownPos = this.getDraggedPosition();
		
		myCanDrag = false;

		var canSelect = this.mode == ControlMode.selecting;

		if (x < 256) {
			this.toolbar.mouseDown(x, y);
		} else {
			var pos = new Pos(x, y);
		
			for (var i = 0; i < this.gates.length; ++ i) {
				var gate = this.gates[i];
				var rect = new Rect(gate.x + 8, gate.y + 8, gate.width - 16, gate.height - 16);
				
				if (rect.contains(pos)) {
					gate.mouseDown();
					if (this.mode == ControlMode.selecting) {
						gate.selected = !gate.selected;
						canSelect = false;
					} else if (this.mode == ControlMode.wiring) {
						if (!gate.selected) {
							this.deselectAll();
							gate.selected = true;
						} else {
							myCanDrag = true;
						}
						return;
					}
				}
			}
			
			var gsize = myGridSize / 2;
			pos.x = Math.round(pos.x / gsize) * gsize;
			pos.y = Math.round(pos.y / gsize) * gsize;
			
			for (var i = 0; i < this.wireGroups.length; ++ i) {
				var group = this.wireGroups[i];
				if (group.crossesPos(pos)) {
					var wire = group.getWireAt(pos);

					if (this.mode == ControlMode.selecting) {
						wire.selected = !wire.selected;
						canSelect = false;
					} else if (this.mode == ControlMode.wiring) {
						if (!wire.selected) {
							this.deselectAll();
							wire.selected = true;
						} else {
							myCanDrag = true;
							return;
						}
					}
				}
			}

			if (canSelect) {
				myIsSelecting = true;
			} else if (this.mode == ControlMode.wiring) {
				this.startWiring(x, y);
			}
		}
	}
	
	this.mouseUp = function(x, y, e)
	{
		this.mouseX = x;
		this.mouseY = y;

		myCtrlDown = e.ctrlKey;

		if (this.toolbar == null) return;

		if (e.shiftKey) this.setMode(ControlMode.selecting);
		else if (this.mode == ControlMode.selecting) this.setMode(ControlMode.wiring);
		
		if (myIsDragging) {
			this.stopDragging();
		} else if (myIsWiring) {
			this.stopWiring();
		} else if (myIsSelecting) {
			myIsSelecting = false;

			var rect = this.getSelectedRect();

			for (var i = 0; i < this.gates.length; ++ i) {
				var gate = this.gates[i];

				if (gate.getRect().intersects(rect)) {
					gate.selected = true;
				}
			}

			var wires = this.getAllWires();
			for (var i = 0; i < wires.length; ++ i) {
				var wire = wires[i];

				if (wire.isHorizontal()) {
					if (wire.start.x < rect.right && wire.end.x > rect.left
	                    && wire.start.y <= rect.bottom && wire.end.y >= rect.top) {
						wire.selected = true;
					}
				} else {
					if (wire.start.x <= rect.right && wire.end.x >= rect.left
	                    && wire.start.y < rect.bottom && wire.end.y > rect.top) {
						wire.selected = true;
					}
				}
			}
		} else if (x < 256) {
			this.toolbar.mouseUp(x, y);
		} else {
			var pos = new Pos(x, y);
			
			var deleted = false;
		
			for (var i = 0; i < this.gates.length; ++ i) {
				var gate = this.gates[i];
				
				if (gate.isMouseDown) {
					var rect = new Rect(gate.x + 8, gate.y + 8, gate.width - 16, gate.height - 16);
					
					if (rect.contains(pos)) {
						if (this.mode == ControlMode.deleting && !deleted) {
							this.removeGate(gate);
							deleted = true;
						} else {
							gate.click();
						}
					}
					
					gate.mouseUp();
				}
			}
			
			if (this.mode == ControlMode.deleting && !deleted) {
				var gsize = 8;
				pos.x = Math.round(pos.x / gsize) * gsize;
				pos.y = Math.round(pos.y / gsize) * gsize;
				
				if (this.mouseDownPos.equals(pos)) {
					for (var i = 0; i < this.wireGroups.length; ++ i) {
						var group = this.wireGroups[i];
						if (group.crossesPos(pos)) {
							var wire = group.getWireAt(pos);
							this.removeWire(wire);
							break;
						}
					}
				}
			}
		}

		this.mouseDownPos = null;
	}
	
	this.click = function(x, y, e)
	{
		this.mouseX = x;
		this.mouseY = y;

		myCtrlDown = e.ctrlKey;

		if (e.shiftKey) this.setMode(ControlMode.selecting);
		else if (this.mode == ControlMode.selecting) this.setMode(ControlMode.wiring);
		
		if (x < 256) {
			this.toolbar.click(x, y);
		}
	}
	
	this.keyDown = function(e)
	{
		if (e.keyCode == 46) this.setMode(ControlMode.deleting);
		if (e.keyCode == 16) this.setMode(ControlMode.selecting);
		if (e.keyCode == 17) myCtrlDown = true;

		if (e.keyCode == 83 && e.ctrlKey) {
			Saving.save();
			e.preventDefault();
		}

		if (e.keyCode == 79 && e.ctrlKey) {
			Saving.loadFromPrompt();
			e.preventDefault();
		}
	}
	
	this.keyUp = function(e)
	{
		if ((e.keyCode == 46 && this.mode == ControlMode.deleting)
			|| (e.keyCode == 16 && this.mode == ControlMode.selecting))
			this.setMode(ControlMode.wiring);

		if (e.keyCode == 17) myCtrlDown = false;
	}

	this.getGridSize = function()
	{
		return myGridSize;
	}

	this.setGridSize = function(size)
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
	
	this.run = function()
	{
		setInterval(this.mainLoop, 1000.0 / 60.0, this);
	}
	
	this.mainLoop = function(self)
	{
		for (var i = 0; i < 4; ++ i) {
			self.step();
		}

		self.context.fillStyle = self.context.createPattern(myGridImage, "repeat");
		self.context.fillRect(256, 0, self.canvas.width - 256, self.canvas.height);
		
		self.render(self.context);
		
		if (myIsDragging) {
			var pos = self.getDraggedPosition();
			mySelection.render(self.context, pos, myCanPlace ? "#6666ff" : "#ff6666");
		} else if (myIsWiring) {		
			var end = self.getWireEnd();
		
			self.context.strokeStyle = self.canPlaceWire(new Wire(myWireStart, self.getWireEnd()))
				? "#009900" : "#990000";
			self.context.lineWidth = 2;
			self.context.beginPath();
			self.context.moveTo(myWireStart.x, myWireStart.y);
			self.context.lineTo(end.x, end.y);
			self.context.stroke();
			self.context.closePath();
		} else if (myIsSelecting) {
			var rect = self.getSelectedRect();

			self.context.beginPath();
			self.context.rect(rect.x - 1, rect.y - 1,
				rect.width + 2, rect.height + 2);
			self.context.globalAlpha = 0.25;
			self.context.fillStyle = "#3333ff";
			self.context.fill();
			self.context.globalAlpha = 0.5;
			self.context.strokeStyle = "#6666ff";
			self.context.stroke();
			self.context.closePath();
			self.context.globalAlpha = 1.0;
		}
		
		self.toolbar.render(self.context);
	}
}

logicSim = new LogicSim();

window.onload = function(e)
{
	if (!images.allImagesLoaded()) {
		images.onAllLoaded = function()
		{
			logicSim.initialize();
			logicSim.run();
		}
	} else {
		logicSim.initialize();
		logicSim.run();
	}
}

window.onmousemove = function(e)
{
	if (e) {
		logicSim.mouseMove(e.pageX, e.pageY, e);
	} else {
		logicSim.mouseMove(window.event.clientX, window.event.clientY, window.event);
	}
}

window.onmousedown = function(e)
{
	if (e) {
		logicSim.mouseDown(e.pageX, e.pageY, e);
	} else {
		logicSim.mouseDown(window.event.clientX, window.event.clientY, window.event);
	}
}

window.onmouseup = function(e)
{
	if (e) {
		logicSim.mouseUp(e.pageX, e.pageY, e);
	} else {
		logicSim.mouseUp(window.event.clientX, window.event.clientY, window.event);
	}
}

window.onclick = function(e)
{
	if (e) {
		logicSim.click(e.pageX, e.pageY, e);
	} else {
		logicSim.click(window.event.clientX, window.event.clientY, window.event);
	}
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
