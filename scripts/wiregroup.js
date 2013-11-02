function WireGroup()
{
    var myWires = new Array();
    var myBounds = null;

    this.input = null;
    this.outputs = new Array();
    
    this.isEmpty = false;
    
    this.getWires = function()
    {
        return myWires;
    }
    
    this.canAddWire = function(wire)
    {   
        if (myBounds == null || !myBounds.intersectsWire(wire, true)) return false;

        for (var i = 0; i < myWires.length; ++ i) {
            if (myWires[i].canConnect(wire)) {
                return true;
            }
        }
        
        return false;
    }
    
    this.crossesPos = function(pos)
    {
        if (myBounds == null || !myBounds.contains(pos)) return false;

        for (var i = 0; i < myWires.length; ++ i) {
            if (myWires[i].crossesPos(pos)) {
                return true;
            }
        }
        
        return false;
    }
    
    this.getWireAt = function(pos)
    {
        if (myBounds == null || !myBounds.contains(pos)) return null;

        for (var i = 0; i < myWires.length; ++ i) {
            if (myWires[i].crossesPos(pos)) return myWires[i];
        }
        
        return null;
    }
    
    this.setInput = function(gate, output)
    {
        this.input = new Link(gate, output);
        
        for (var i = 0; i < this.outputs.length; ++ i) {
            var link = this.outputs[i];
            link.gate.linkInput(this.input.gate, this.input.socket, link.socket);
        }
    }
    
    this.removeInput = function()
    {
        this.input = null;
        
        var wires = myWires;
        myWires = [];

        for (var i = 0; i < this.outputs.length; ++ i) {
            var link = this.outputs[i];
            logicSim.removeGate(link.gate);
            logicSim.placeGate(link.gate);
        }

        myWires = wires;
    }
    
    this.addOutput = function(gate, input)
    {   
        var link = new Link(gate, input);
        
        if (this.outputs.containsEqual(link)) return;
        
        if (this.input != null) {
            gate.linkInput(this.input.gate, this.input.socket, link.socket);
        }

        this.outputs.push(link);
    }
    
    this.removeOutput = function(link)
    {
        logicSim.removeGate(link.gate);
        logicSim.placeGate(link.gate);
    }
    
    this.removeAllOutputs = function()
    {
        var wires = myWires;
        myWires = [];

        for (var i = this.outputs.length - 1; i >= 0; -- i) {
            this.removeOutput(this.outputs[i]);
        }

        myWires = wires;
    }

    this.addWire = function(wire)
    {
        if (wire.group == this) return;

        if (myBounds == null) {
            myBounds = new Rect(wire.start.x, wire.start.y,
                wire.end.x - wire.start.x, wire.end.y - wire.start.y);
        } else {
            if (wire.start.x < myBounds.left) {
                myBounds.setLeft(wire.start.x);
            }
            if (wire.end.x > myBounds.right) {
                myBounds.setRight(wire.end.x);
            }
            if (wire.start.y < myBounds.top) {
                myBounds.setTop(wire.start.y);
            }
            if (wire.end.y > myBounds.bottom) {
                myBounds.setBottom(wire.end.y);
            }
        }

        wire.group = this;

        myWires.push(wire);
    }
    
    this.render = function(context, offset, selectClr)
    {
        for (var i = 0; i < myWires.length; ++ i) {
            myWires[i].render(context, offset, selectClr);
        }
    }
}
