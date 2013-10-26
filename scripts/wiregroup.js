function WireGroup(wire)
{
    var myWires = new Array();
    myWires.push(wire);

    this.input = null;
    this.outputs = new Array();
    
    this.isEmpty = false;
    
    this.getWires = function()
    {
        return myWires;
    }
    
    this.canAddWire = function(wire)
    {   
        for (var i = 0; i < myWires.length; ++ i)
            if (myWires[i].canConnect(wire))
                return true;
        
        return false;
    }
    
    this.crossesPos = function(pos)
    {
        for (var i = 0; i < myWires.length; ++ i)
            if (myWires[i].crossesPos(pos))
                return true;
        
        return false;
    }
    
    this.getWireAt = function(pos)
    {
        for (var i = 0; i < myWires.length; ++ i)
            if (myWires[i].crossesPos(pos))
                return myWires[i];
        
        return null;
    }
    
    this.setInput = function(gate, output)
    {
        this.input = new Link(gate, output);
        
        for (var i = 0; i < this.outputs.length; ++ i)
        {
            var link = this.outputs[i];
            link.gate.linkInput(this.input.gate, this.input.socket, link.socket);
        }
    }
    
    this.removeInput = function()
    {
        this.input = null;
        
        var wires = myWires;
        myWires = [];

        for (var i = 0; i < this.outputs.length; ++ i)
        {
            var link = this.outputs[i];
            logicSim.removeGate(link.gate);
            logicSim.placeGate(link.gate);
        }

        myWires = wires;
    }
    
    this.addOutput = function(gate, input)
    {   
        var link = new Link(gate, input);
        
        if (this.outputs.containsEqual(link))
            return;
        
        if (this.input != null)
            gate.linkInput(this.input.gate, this.input.socket, link.socket);
            
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

        for (var i = this.outputs.length - 1; i >= 0; -- i)
            this.removeOutput(this.outputs[i]);

        myWires = wires;
    }
    
    this.addWire = function(wire)
    {       
        if (wire.group != this)
        {
            for (var i = 0; i < myWires.length; ++ i)
            {
                if (myWires[i].canConnect(wire))
                {
                    myWires[i].connect(wire);
                    wire.connect(myWires[i]);
                }
            }
            
            var oldGroup = wire.group;
            
            oldGroup.merge(this, wire);
            
            if (oldGroup.input != null)
                this.setInput(oldGroup.input.gate, oldGroup.input.socket);
            
            for (var i = 0; i < oldGroup.outputs.length; ++i)
                this.addOutput(oldGroup.outputs[i].gate, oldGroup.outputs[i].socket);
            
            wire.group = this;
            
            for (var i = 0; i < myWires.length; ++ i)
            {           
                var other = myWires[i];
                if (other != wire && other.runsAlong(wire))
                {
                    other.merge(wire);
                    other.selected = other.selected || wire.selected;
                    wire = other;
                    myWires.splice(i, 1);
                    i = -1;
                }
            }
        }
        
        if (!myWires.contains(wire))
            myWires.push(wire);

        return wire;
    }
    
    this.merge = function(group, ignoreWire)
    {
        for (var i = 0; i < myWires.length; ++ i)
        {
            if (myWires[i] != ignoreWire)
            {
                myWires[i].group = group;
                group.addWire(myWires[i].clone());
            }
        }
        
        myWires = new Array();
        
        this.isEmpty = true;
    }
    
    this.render = function(context, offset)
    {
        for (var i = 0; i < myWires.length; ++ i)
            myWires[i].render(context, offset);
    }
}
