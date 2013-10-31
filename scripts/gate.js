SocketFace = new Object();

SocketFace.left 	= "LEFT";
SocketFace.top 		= "TOP";
SocketFace.right 	= "RIGHT";
SocketFace.bottom 	= "BOTTOM";

function SocketInfo(face, offset, label)
{
	this.face = face;
	this.offset = offset;
	this.label = label;
	
	this.isLeft 	= this.face == SocketFace.left;
	this.isTop 		= this.face == SocketFace.top;
	this.isRight 	= this.face == SocketFace.right;
	this.isBottom 	= this.face == SocketFace.bottom;
	
	this.getPosition = function(gateType, x, y)
	{
		return new Pos(
			x + 
			((this.face == SocketFace.left) ? 0
			: (this.face == SocketFace.right) ? gateType.width
			: this.offset * 8),
			y +
			((this.face == SocketFace.top) ? 0
			: (this.face == SocketFace.bottom) ? gateType.height
			: this.offset * 8)
		);
	}
}

function GateType(name, width, height, inputs, outputs)
{
	this.isGateType = true;

	this.name = name;

	this.width = width;
	this.height = height;
	
	this.inputs = inputs;
	this.outputs = outputs;
	
	this.func = function(gate, inputs)
	{
		return [false];
	}
	
	this.initialize = function(gate)
	{
		
	}
	
	this.click = function(gate)
	{
		
	}
	
	this.mouseDown = function(gate)
	{
	
	}
	
	this.mouseUp = function(gate)
	{
	
	}

	this.saveData = function(gate)
	{
		return null;
	}

	this.loadData = function(gate, data)
	{

	}
	
	this.render = function(context, x, y, gate)
	{
		context.strokeStyle = "#000000";
		context.lineWidth = 2;
		
		for (var i = 0; i < this.inputs.length + this.outputs.length; ++ i)
		{
			var inp = (i < this.inputs.length ? this.inputs[i] : this.outputs[i - this.inputs.length]);
			var start = inp.getPosition(this, x, y);
			var end = inp.getPosition(this, x, y);
			
			if (inp.face == SocketFace.left || inp.face == SocketFace.right)
				end.x = x + this.width / 2;
			else
				end.y = y + this.height / 2;
				
			context.beginPath();
			context.moveTo(start.x, start.y);
			context.lineTo(end.x, end.y);
			context.stroke();
			context.closePath();
		}
	}
}

function DefaultGate(name, image, renderOverride, inputs, outputs)
{
	this.__proto__ = new GateType(name, image.width, image.height, inputs, outputs);
	
	this.ctorname = arguments.callee.caller.name;

	this.image = image;
	this.renderOverride = renderOverride;
	
	this.render = function(context, x, y, gate)
	{
		this.__proto__.render(context, x, y, gate);
		if (!this.renderOverride)
			context.drawImage(this.image, x, y);
	}
}

function CustomIC(name, environment)
{
	var envInputs = environment.getInputs();
	var envOutputs = environment.getOutputs();

	var inputs = new Array();
	var outputs = new Array();

	this.ctorname = arguments.callee.name;

	this.environment = environment;
	
	for (var i = 0; i < envInputs.length; ++ i) {
		var input = envInputs[i];
		inputs[i] = new SocketInfo(SocketFace.left, 2 + i * 2, "I" + i)
	}

	for (var i = 0; i < envOutputs.length; ++ i) {
		var input = envOutputs[i];
		outputs[i] = new SocketInfo(SocketFace.right, 2 + i * 2, "O" + i)
	}

	this.__proto__ = new GateType(name, 64,
		Math.max(32, 16 * (Math.max(envInputs.length, envOutputs.length) + 1)),
		inputs, outputs);

	this.initialize = function(gate)
	{
		gate.environment = this.environment.clone();
	}

	this.func = function(gate, inputs)
	{
		var ins = gate.environment.getInputs();
		for (var i = 0; i < ins.length; ++ i) {
			ins[i].value = inputs[i];
		}

		gate.environment.step();

		var vals = new Array();
		var outs = gate.environment.getOutputs();
		for (var i = 0; i < outs.length; ++ i) {
			vals[i] = outs[i].value;
		}

		return vals;
	}

	this.render = function(context, x, y, gate)
	{
		this.__proto__.render(context, x, y, gate);

		context.strokeStyle = "#000000";
		context.fillStyle = "#ffffff";
		context.lineWidth = 3;

		context.beginPath();
		context.rect(x + 9.5, y + 1.5, this.width - 19, this.height - 3);
		context.fill();
		context.stroke();
		context.closePath();

		context.fillStyle = "#000000";
		context.font = "bold 16px sans-serif";
		context.textAlign = "center";
		context.textBaseline = "middle";

		var width = context.measureText(this.name).width;

		if (this.width - 16 > this.height) {
			context.fillText(this.name, x + this.width / 2, y + this.height / 2, this.width - 24);
		} else {
			context.save();
			context.translate(x + this.width / 2, y + this.height / 2);
			context.rotate(Math.PI / 2);
			context.fillText(this.name, 0, 0, this.height - 12);
			context.restore();
		}

		context.textAlign = "left";
		context.textBaseline = "alphabetic";
	}
}

function BufferGate()
{
	this.__proto__ = new DefaultGate("BUF", images.buffer, false,
		[
			new SocketInfo(SocketFace.left, 2, "A")
		],
		[
			new SocketInfo(SocketFace.right, 2, "Q")
		]
	);
	
	this.func = function(gate, inputs)
	{
		return [inputs[0]];
	}
}

function AndGate()
{
	this.__proto__ = new DefaultGate("AND", images.and, false,
		[
			new SocketInfo(SocketFace.left, 1, "A"),
			new SocketInfo(SocketFace.left, 3, "B")
		],
		[
			new SocketInfo(SocketFace.right, 2, "Q")
		]
	);
	
	this.func = function(gate, inputs)
	{
		return [inputs[0] && inputs[1]];
	}
}

function OrGate()
{
	this.__proto__ = new DefaultGate("OR", images.or, false,
		[
			new SocketInfo(SocketFace.left, 1, "A"),
			new SocketInfo(SocketFace.left, 3, "B")
		],
		[
			new SocketInfo(SocketFace.right, 2, "Q")
		]
	);
	
	this.func = function(gate, inputs)
	{
		return [inputs[0] || inputs[1]];
	}
}

function XorGate()
{
	this.__proto__ = new DefaultGate("XOR", images.xor, false,
		[
			new SocketInfo(SocketFace.left, 1, "A"),
			new SocketInfo(SocketFace.left, 3, "B")
		],
		[
			new SocketInfo(SocketFace.right, 2, "Q")
		]
	);
	
	this.func = function(gate, inputs)
	{
		return [inputs[0] ^ inputs[1]];
	}
}

function NotGate()
{
	this.__proto__ = new DefaultGate("NOT", images.not, false,
		[
			new SocketInfo(SocketFace.left, 2, "A")
		],
		[
			new SocketInfo(SocketFace.right, 2, "Q")
		]
	);
	
	this.func = function(gate, inputs)
	{
		return [!inputs[0]];
	}
}

function NandGate()
{
	this.__proto__ = new DefaultGate("NAND", images.nand, false,
		[
			new SocketInfo(SocketFace.left, 1, "A"),
			new SocketInfo(SocketFace.left, 3, "B")
		],
		[
			new SocketInfo(SocketFace.right, 2, "Q")
		]
	);
	
	this.func = function(gate, inputs)
	{
		return [!inputs[0] || !inputs[1]];
	}
}

function NorGate()
{
	this.__proto__ = new DefaultGate("NOR", images.nor, false,
		[
			new SocketInfo(SocketFace.left, 1, "A"),
			new SocketInfo(SocketFace.left, 3, "B")
		],
		[
			new SocketInfo(SocketFace.right, 2, "Q")
		]
	);
	
	this.func = function(gate, inputs)
	{
		return [!inputs[0] && !inputs[1]];
	}
}

function XnorGate()
{
	this.__proto__ = new DefaultGate("XNOR", images.xnor, false,
		[
			new SocketInfo(SocketFace.left, 1, "A"),
			new SocketInfo(SocketFace.left, 3, "B")
		],
		[
			new SocketInfo(SocketFace.right, 2, "Q")
		]
	);
	
	this.func = function(gate, inputs)
	{
		return [inputs[0] == inputs[1]];
	}
}

function ConstInput()
{
	this.onImage = images.conston;
	this.offImage = images.constoff;
	
	this.__proto__ = new DefaultGate("IN", this.onImage, true, [],
		[
			new SocketInfo(SocketFace.right, 2, "Q")
		]
	);
	
	this.initialize = function(gate)
	{
		gate.on = true;
	}
	
	this.click = function(gate)
	{
		gate.on = !gate.on;
	}
	
	this.func = function(gate, inputs)
	{
		return [gate.on];
	}

	this.saveData = function(gate)
	{
		return gate.on;
	}

	this.loadData = function(gate, data)
	{
		gate.on = data;
	}
	
	this.render = function(context, x, y, gate)
	{
		this.__proto__.render(context, x, y);
		context.drawImage(gate == null || gate.on ? this.onImage : this.offImage, x, y);
	}
}

function ClockInput()
{
	this.__proto__ = new DefaultGate("CLOCK", images.clock, false, [],
		[
			new SocketInfo(SocketFace.right, 2, "Q")
		]
	);
	
	this.func = function(gate, inputs)
	{
		var period = 1000 / gate.freq;
		return [new Date().getTime() % period >= period / 2];
	}
	
	this.initialize = function(gate)
	{
		gate.freq = 1;
	}

	this.saveData = function(gate)
	{
		return gate.freq;
	}

	this.loadData = function(gate, data)
	{
		gate.freq = data;
	}
	
	this.click = function(gate)
	{
		gate.freq *= 2;
		
		if (gate.freq >= 32)
			gate.freq = 0.125;
	}
}

function ToggleSwitch()
{
	this.openImage = images.switchopen;
	this.closedImage = images.switchclosed;

	this.__proto__ = new DefaultGate("TSWITCH", this.openImage, true,
		[
			new SocketInfo(SocketFace.left, 2, "A"),
		],
		[
			new SocketInfo(SocketFace.right, 2, "Q")
		]
	);
	
	this.func = function(gate, inputs)
	{
		return [!gate.open && inputs[0]];
	}
	
	this.initialize = function(gate)
	{
		gate.open = true;
	}
	
	this.click = function(gate)
	{
		gate.open = !gate.open;
	}

	this.saveData = function(gate)
	{
		return gate.open;
	}

	this.loadData = function(gate, data)
	{
		gate.open = data;
	}
	
	this.render = function(context, x, y, gate)
	{
		this.__proto__.render(context, x, y);
		context.drawImage(gate == null || gate.open ? this.openImage : this.closedImage, x, y);
	}
}

function PushSwitchA()
{
	this.openImage = images.pushswitchaopen;
	this.closedImage = images.pushswitchaclosed;

	this.__proto__ = new DefaultGate("PSWITCHA", this.openImage, true,
		[
			new SocketInfo(SocketFace.left, 2, "A"),
		],
		[
			new SocketInfo(SocketFace.right, 2, "Q")
		]
	);
	
	this.func = function(gate, inputs)
	{
		return [!gate.open && inputs[0]];
	}
	
	this.initialize = function(gate)
	{
		gate.open = true;
	}
	
	this.mouseDown = function(gate)
	{
		gate.open = false;
	}
	
	this.mouseUp = function(gate)
	{
		gate.open = true;
	}
	
	this.render = function(context, x, y, gate)
	{
		this.__proto__.render(context, x, y);
		context.drawImage(gate == null || gate.open ? this.openImage : this.closedImage, x, y);
	}
}

function PushSwitchB()
{
	this.openImage = images.pushswitchbopen;
	this.closedImage = images.pushswitchbclosed;

	this.__proto__ = new DefaultGate("PSWITCHB", this.closedImage, true,
		[
			new SocketInfo(SocketFace.left, 2, "A"),
		],
		[
			new SocketInfo(SocketFace.right, 2, "Q")
		]
	);
	
	this.func = function(gate, inputs)
	{
		return [!gate.open && inputs[0]];
	}
	
	this.initialize = function(gate)
	{
		gate.open = false;
	}
	
	this.mouseDown = function(gate)
	{
		gate.open = true;
	}
	
	this.mouseUp = function(gate)
	{
		gate.open = false;
	}
	
	this.render = function(context, x, y, gate)
	{
		this.__proto__.render(context, x, y);
		context.drawImage(gate != null && gate.open ? this.openImage : this.closedImage, x, y);
	}
}

function OutputDisplay()
{
	this.onImage = images.outon;
	this.offImage = images.outoff;

	this.__proto__ = new DefaultGate("OUT", this.onImage, true,
		[
			new SocketInfo(SocketFace.left, 2, "A"),
		],
		[]
	);
	
	this.func = function(gate, inputs)
	{
		gate.on = inputs[0];
		return [];
	}
	
	this.initialize = function(gate)
	{
		gate.on = false;
	}
	
	this.render = function(context, x, y, gate)
	{
		this.__proto__.render(context, x, y);
		context.drawImage(gate == null || !gate.on ? this.offImage : this.onImage, x, y);
	}
}

function SevenSegDisplay()
{
	this.baseImage = images.sevsegbase;
	this.segImages =
	[
		images.sevsega, images.sevsegb, images.sevsegc, images.sevsegdp,
		images.sevsegd, images.sevsege, images.sevsegf, images.sevsegg
	];

	this.__proto__ = new DefaultGate("SEVSEG", this.baseImage, true,
		[
			new SocketInfo(SocketFace.right, 2, "A"),
			new SocketInfo(SocketFace.right, 4, "B"),
			new SocketInfo(SocketFace.right, 6, "C"),
			new SocketInfo(SocketFace.right, 8, "DP"),
			new SocketInfo(SocketFace.left,  8, "D"),
			new SocketInfo(SocketFace.left,  6, "E"),
			new SocketInfo(SocketFace.left,  4, "F"),
			new SocketInfo(SocketFace.left,  2, "G")
		],
		[]
	);
	
	this.func = function(gate, inputs)
	{
		gate.active = inputs;
		return [];
	}
	
	this.initialize = function(gate)
	{
		gate.active = [false, false, false, false, false, false, false, false];
	}
	
	this.render = function(context, x, y, gate)
	{
		this.__proto__.render(context, x, y);
		context.drawImage(this.baseImage, x, y);
		
		if (gate != null)
			for (var i = 0; i < 8; ++ i)
				if (gate.active[i])
					context.drawImage(this.segImages[i], x, y);
	}
}

function DFlipFlop()
{
	this.__proto__ = new DefaultGate("DFLIPFLOP", images.dflipflop, false,
		[
			new SocketInfo(SocketFace.left,  2, "D"),
			new SocketInfo(SocketFace.left,  6, ">")
		],
		[
			new SocketInfo(SocketFace.right,  2, "Q"),
			new SocketInfo(SocketFace.right,  6, "NQ")
		]
	);
	
	this.func = function(gate, inputs)
	{
		if (!gate.oldClock && inputs[1]) {
			gate.state = inputs[0];
		}

		gate.oldClock = inputs[1];

		return [gate.state, !gate.state];
	}
	
	this.initialize = function(gate)
	{
		gate.state = false;
		gate.oldClock = false;
	}

	this.saveData = function(gate)
	{
		return [gate.state, gate.oldClock];
	}

	this.loadData = function(gate, data)
	{
		gate.state = data[0];
		gate.oldClock = data[1];
	}
}

function Encoder()
{
	var inputs = [];
	for (var i = 0; i < 9; ++ i)
		inputs[i] = new SocketInfo(SocketFace.left, 2 + i * 2, "I" + i);

	var outputs = [];
	for (var i = 0; i < 4; ++ i)
		outputs[i] = new SocketInfo(SocketFace.right, 4 + i * 4, "O" + i);

	this.__proto__ = new DefaultGate("ENCODER", images.encoder, false, inputs, outputs);
	
	this.func = function(gate, inp)
	{
		var val = 0;
		for (var i = 8; i >= 0; -- i)
		{
			if (inp[i])
			{
				val = i + 1;
				break;
			}
		}

		var out = [];
		for (var i = 0; i < 4; ++ i)
			out[i] = (val & (1 << i)) != 0;

		return out;
	}
}

function Decoder()
{
	var inputs = [];
	for (var i = 0; i < 4; ++ i)
		inputs[i] = new SocketInfo(SocketFace.left, 4 + i * 4, "I" + i);

	var outputs = [];
	for (var i = 0; i < 9; ++ i)
		outputs[i] = new SocketInfo(SocketFace.right, 2 + i * 2, "O" + i);

	this.__proto__ = new DefaultGate("DECODER", images.decoder, false, inputs, outputs);
	
	this.func = function(gate, inp)
	{
		var val = 0;
		for (var i = 0; i < 4; ++ i)
			if (inp[i]) val += 1 << i;

		var out = [];
		for (var i = 0; i < 9; ++ i)
			out[i] = val == (i + 1);

		return out;
	}
}

function SevenSegDecoder()
{
	var inputs = [];
	for (var i = 0; i < 4; ++ i)
		inputs[i] = new SocketInfo(SocketFace.left, 2 + i * 4, "I" + i);

	var outputs = [];
	for (var i = 0; i < 7; ++ i)
		outputs[i] = new SocketInfo(SocketFace.right, 2 + i * 2, "O" + i);

	this.__proto__ = new DefaultGate("7447", images.sevsegdecoder, false, inputs, outputs);
	
	var myOutputs = [
		[ true,  true,  true,  false, true,  true,  true  ],
		[ true,  true,  false, false, false, false, false ],
		[ false, true,  true,  true,  false, true,  true  ],
		[ true,  true,  true,  true,  false, false, true  ],
		[ true,  true,  false, true,  true,  false, false ],
		[ true,  false, true,  true,  true,  false, true  ],
		[ true,  false, true,  true,  true,  true,  true  ],
		[ true,  true,  true,  false, false, false, false ],
		[ true,  true,  true,  true,  true,  true,  true  ],
		[ true,  true,  true,  true,  true,  false, true  ],
		[ false, false, false, false, false, false, false ]
	];

	this.func = function(gate, inp)
	{
		var val = 0;
		for (var i = 0; i < 4; ++ i)
			if (inp[i]) val += 1 << i;

		return myOutputs[Math.min(val, myOutputs.length - 1)];
	}
}

function ICInput()
{
	this.__proto__ = new DefaultGate("ICINPUT", images.input, false,
		[],
		[
			new SocketInfo(SocketFace.right, 2, "A")
		]
	);

	this.initialize = function(gate)
	{
		gate.value = false;
	}
	
	this.func = function(gate, inputs)
	{
		return [gate.value];
	}
}

function ICOutput()
{
	this.__proto__ = new DefaultGate("ICOUTPUT", images.output, false,
		[
			new SocketInfo(SocketFace.left, 2, "A")
		],
		[]
	);

	this.initialize = function(gate)
	{
		gate.value = false;
	}
	
	this.func = function(gate, inputs)
	{
		gate.value = inputs[0];
		return [];
	}
}

function Link(gate, socket)
{
	this.gate = gate;
	this.socket = socket;
	
	this.getValue = function()
	{
		return this.gate.getOutput(this.socket);
	}
	
	this.equals = function(obj)
	{
		return this.gate == obj.gate && this.socket == obj.socket;
	}
}

function Gate(gateType, x, y, noInit)
{
	if (noInit == null) noInit = false;

	var myOutputs = new Array();
	var myNextOutputs = new Array();
	var myInLinks = new Array();
	
	this.type = gateType;
	
	this.x = x;
	this.y = y;
	
	this.isMouseDown = false;
	
	this.width = this.type.width;
	this.height = this.type.height;
	
	this.inputs = this.type.inputs;
	this.outputs = this.type.outputs;
	
	this.selected = false;

	for (var i = 0; i < this.type.inputs.length; ++i)
		myInLinks[i] = null;
	
	for (var i = 0; i < this.type.outputs.length; ++i)
		myOutputs[i] = false;

	this.clone = function(shallow)
	{
		if (shallow == null) shallow = false;

		var copy = new Gate(this.type, this.x, this.y, shallow);

		if (!shallow) copy.loadData(this.saveData());
		
		return copy;
	}
	
	this.getRect = function(gridSize)
	{
		if (!gridSize)
			gridSize = 1;
	
		var rl = Math.round(this.x);
		var rt = Math.round(this.y);
		var rr = Math.round(this.x + this.width);
		var rb = Math.round(this.y + this.height);
		
		rl = Math.floor(rl / gridSize) * gridSize;
		rt = Math.floor(rt / gridSize) * gridSize;
		rr = Math.ceil(rr / gridSize) * gridSize;
		rb = Math.ceil(rb / gridSize) * gridSize;
		
		return new Rect(rl, rt, rr - rl, rb - rt);
	}
	
	this.linkInput = function(gate, output, input)
	{
		var index = this.inputs.indexOf(input);
		myInLinks[index] = new Link(gate, output);
	}
	
	this.isLinked = function(gate)
	{
		for (var i = 0; i < this.inputs.length; ++ i)
			if (myInLinks[i] != null && myInLinks[i].gate == gate)
				return true;
		
		return false;
	}
	
	this.unlinkAll = function()
	{
		for (var i = 0; i < this.inputs.length; ++ i)
			myInLinks[i] = null;
	}
	
	this.unlinkGate = function(gate)
	{
		for (var i = 0; i < this.inputs.length; ++ i)
			if (myInLinks[i] != null && myInLinks[i].gate == gate)
				myInLinks[i] = null;
	}
	
	this.unlinkInput = function(input)
	{
		var index = this.inputs.indexOf(input);
		myInLinks[index] = null;
	}

	this.getOutputs = function()
	{
		return myOutputs;
	}
	
	this.setOutputs = function(outputs)
	{
		myOutputs = outputs;
	}

	this.getOutput = function(output)
	{
		var index = this.outputs.indexOf(output);
		return myOutputs[index];
	}
	
	this.click = function()
	{
		this.type.click(this);
	}
	
	this.mouseDown = function()
	{
		this.isMouseDown = true;
		this.type.mouseDown(this);
	}
	
	this.mouseUp = function()
	{
		this.isMouseDown = false;
		this.type.mouseUp(this);
	}
	
	this.step = function()
	{
		var inVals = new Array();
	
		for (var i = 0; i < this.inputs.length; ++ i)
		{
			var link = myInLinks[i];
			inVals[i] = (myInLinks[i] == null)
				? false : link.getValue();
		}
		
		myNextOutputs = this.type.func(this, inVals);
	}
	
	this.commit = function()
	{
		myOutputs = myNextOutputs;
	}

	this.saveData = function()
	{
		return this.type.saveData(this);
	}

	this.loadData = function(data)
	{
		this.type.loadData(this, data);
	}
	
	this.render = function(context, offset, selectClr)
	{
		if (this.selected) {
			var rect = this.getRect();

			if (selectClr == null) selectClr = "#6666FF";

			context.globalAlpha = 0.5;
			context.fillStyle = selectClr;
			context.fillRect(rect.left - 4 + offset.x, rect.top - 4 + offset.y,
				rect.width + 8, rect.height + 8);
			context.globalAlpha = 1.0;
		}

		this.type.render(context, this.x + offset.x, this.y + offset.y, this);
		
		context.strokeStyle = "#000000";
		context.lineWidth = 2;
		context.fillStyle = "#9999FF";
		
		for (var i = 0; i < this.inputs.length + this.outputs.length; ++ i) {
			var inp = (i < this.inputs.length ? this.inputs[i]
				: this.outputs[i - this.inputs.length]);
			var pos = inp.getPosition(this.type, this.x, this.y);
				
			if (i < this.inputs.length) {
				if (myInLinks[i] != null) {
					context.fillStyle = myInLinks[i].getValue() ? "#FF9999" : "#9999FF";
				} else {
					context.fillStyle = "#999999";
				}
			} else {
				context.fillStyle = myOutputs[i - this.inputs.length]
					? "#FF9999" : "#9999FF";
			}

			context.beginPath();
			context.arc(pos.x + offset.x, pos.y + offset.y, 4, 0, Math.PI * 2, true);
			context.fill();
			context.stroke();
			context.closePath();
		}
	}
	
	if (!noInit) {
		this.type.initialize(this);
	}
}
