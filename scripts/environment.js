function Environment()
{    
    this.gates = new Array();
    this.wireGroups = new Array();

    this.clear = function()
    {
        this.gates = new Array();
        this.wireGroups = new Array();
    }

    this.clone = function()
    {
        var env = new Environment();

        for (var i = 0; i < this.gates.length; ++i) {
            env.placeGate(this.gates[i].clone());
        }

        var wires = this.getAllWires();
        for (var i = 0; i < wires.length; ++i) {
            env.placeWire(wires[i].start, wires[i].end);
        }

        return env;
    }

    this.tryMerge = function(env, offset)
    {
        if (offset == null) offset = new Pos(0, 0);

        for (var i = 0; i < env.gates.length; ++i) {
            var gate = env.gates[i].clone();
            gate.x += offset.x;
            gate.y += offset.y;
            if (!this.canPlaceGate(gate)) return false;
            this.placeGate(gate);
        }

        var wires = env.getAllWires();
        for (var i = 0; i < wires.length; ++i) {
            var wire = wires[i];
            wire = new Wire(wire.start.add(offset), wire.end.add(offset));
            if (!this.canPlaceWire(wire)) return false;
            this.placeWire(wire.start, wire.end);
        }

        return true;
    }

    this.getAllWires = function()
    {
        var wires = [];
        for (var i = this.wireGroups.length - 1; i >= 0; i--)
            wires = wires.concat(this.wireGroups[i].getWires());
        return wires;
    }

    this.deselectAll = function()
    {
        for (var i = this.gates.length - 1; i >= 0; --i)
            this.gates[i].selected = false;

        var wires = this.getAllWires();
        for (var i = wires.length - 1; i >= 0; --i)
            wires[i].selected = false;
    }
    
    this.canPlaceGate = function(gate)
    {
        var rect = gate.getRect();
        
        for (var i = 0; i < this.gates.length; ++i)
        {
            var other = this.gates[i].getRect();
            
            if (rect.intersects(other))
                return false;
        }
        
        var crossed = false;
        
        for (var i = 0; i < this.wireGroups.length; ++ i)
        {
            var group = this.wireGroups[i];
            var wires = group.getWires();

            for (var j = 0; j < wires.length; ++ j)
            {
                var wire = wires[j];
                if (wire.start.x < rect.right && wire.end.x > rect.left
                    && wire.start.y <= rect.bottom && wire.end.y >= rect.top)
                    return false;
            }

            for (var j = 0; j < gate.outputs.length; ++ j)
            {
                var out = gate.outputs[j];
                if (group.crossesPos(out.getPosition(gate.type, gate.x, gate.y)))
                {
                    if (crossed || group.input != null)
                        return false;
                    
                    crossed = true;
                }
            }
        }
        
        return true;
    }

    this.placeGate = function(gate)
    {
        gate.unlinkAll();

        var r0 = gate.getRect(logicSim.getGridSize());
    
        for (var i = 0; i < this.gates.length; ++ i)
        {
            var other = this.gates[i];
            var r1 = other.getRect(logicSim.getGridSize());
            
            if (r0.left == r1.right || r1.left == r0.right
                || r0.top == r1.bottom || r1.top == r0.bottom)
            {               
                for (var j = 0; j < gate.inputs.length; ++ j)
                {
                    var inp = gate.inputs[j];
                    for (var k = 0; k < other.outputs.length; ++ k)
                    {
                        var out = other.outputs[k];
                        
                        if (inp.getPosition(gate.type, gate.x, gate.y).equals(
                            out.getPosition(other.type, other.x, other.y)))
                            gate.linkInput(other, out, inp);
                    }
                }
                
                for (var j = 0; j < gate.outputs.length; ++ j)
                {
                    var out = gate.outputs[j];
                    for (var k = 0; k < other.inputs.length; ++ k)
                    {
                        var inp = other.inputs[k];
                        
                        if (out.getPosition(gate.type, gate.x, gate.y).equals(
                            inp.getPosition(other.type, other.x, other.y)))
                            other.linkInput(gate, out, inp);
                    }
                }
            }
        }
        
        for (var i = 0; i < this.wireGroups.length; ++ i)
        {
            var group = this.wireGroups[i];
                    
            for (var j = 0; j < gate.inputs.length; ++ j)
            {
                var pos = gate.inputs[j].getPosition(gate.type, gate.x, gate.y);
                
                if (group.crossesPos(pos))
                    group.addOutput(gate, gate.inputs[j]);
            }
            
            for (var j = 0; j < gate.outputs.length; ++ j)
            {
                var pos = gate.outputs[j].getPosition(gate.type, gate.x, gate.y);
                
                if (group.crossesPos(pos))
                    group.setInput(gate, gate.outputs[j]);
            }
        }
        
        this.gates.push(gate);
    }
    
    this.removeGate = function(gate)
    {
        var index = this.gates.indexOf(gate);
        this.gates.splice(index, 1);
        
        for (var i = 0; i < this.gates.length; ++ i)
        {
            if (this.gates[i].isLinked(gate))
                this.gates[i].unlinkGate(gate);
            if (gate.isLinked(this.gates[i]))
                gate.unlinkGate(this.gates[i]);
        }
        
        for (var i = 0; i < this.wireGroups.length; ++ i)
        {
            var group = this.wireGroups[i];
            if (group.input != null && group.input.gate == gate)
                group.input = null;
                
            for (var j = group.outputs.length - 1; j >= 0; -- j)
                if (group.outputs[j].gate == gate)
                    group.outputs.splice(j, 1);
        }
    }

    this.canPlaceWire = function(wire)
    {
        var input = null;
        
        for (var i = 0; i < this.wireGroups.length; ++ i)
        {
            var group = this.wireGroups[i];
            
            if (group.canAddWire(wire))
            {
                if (wire.start.equals(wire.end))
                    return false;

                if (group.input != null) {
                    if (input != null && !group.input.equals(input))
                        return false;
                    
                    input = group.input;
                }
            }
        }
        
        for (var i = 0; i < this.gates.length; ++ i)
        {
            var gate = this.gates[i];
            var rect = gate.getRect(logicSim.getGridSize());

            if (wire.start.x < rect.right && wire.end.x > rect.left
                && wire.start.y <= rect.bottom && wire.end.y >= rect.top)
                return false;
            
            if (wire.start.x == rect.right || rect.left == wire.end.x
                || wire.start.y == rect.bottom || rect.top == wire.end.y)
            {
                for (var j = 0; j < gate.outputs.length; ++ j)
                {
                    var inp = new Link(gate, gate.outputs[j]);
                    var pos = gate.outputs[j].getPosition(gate.type, gate.x, gate.y);
                    
                    if (wire.crossesPos(pos))
                    {
                        if (input != null && !inp.equals(input))
                            return false;
                        
                        input = inp;
                    }
                }
            }
        }
        
        return true;
    }
    
    this.placeWire = function(start, end, selected)
    {
        if (start.equals(end)) {
            return null;
        }

        selected = selected != null ? true : false;
        var wire = new Wire(start, end);
        wire.selected = selected;
        
        for (var i = 0; i < this.gates.length; ++ i)
        {
            var gate = this.gates[i];
            var rect = gate.getRect(logicSim.getGridSize());
            
            if (wire.start.x == rect.right || rect.left == wire.end.x
                || wire.start.y == rect.bottom || rect.top == wire.end.y)
            {               
                for (var j = 0; j < gate.inputs.length; ++ j)
                {
                    var pos = gate.inputs[j].getPosition(gate.type, gate.x, gate.y);
                    
                    if (wire.crossesPos(pos))
                        wire.group.addOutput(gate, gate.inputs[j]);
                }
                
                for (var j = 0; j < gate.outputs.length; ++ j)
                {
                    var pos = gate.outputs[j].getPosition(gate.type, gate.x, gate.y);
                    
                    if (wire.crossesPos(pos))
                        wire.group.setInput(gate, gate.outputs[j]);
                }
            }
        }
    
        for (var i = 0; i < this.wireGroups.length; ++ i)
        {
            var group = this.wireGroups[i];
            if (group.canAddWire(wire))
                wire = group.addWire(wire);
        }
        
        for (var i = this.wireGroups.length - 1; i >= 0; --i)
            if (this.wireGroups[i].isEmpty)
                this.wireGroups.splice(i, 1);
        
        if (!this.wireGroups.contains(wire.group))
            this.wireGroups.push(wire.group);

        return wire;
    }
    
    this.removeWire = function(wire)
    {
        this.removeWires([wire]);
    }

    this.removeWires = function(toRemove)
    {
        var groups = new Array();

        for (var i = 0; i < toRemove.length; ++ i) {
            var group = toRemove[i].group;
            if (!groups.contains(group)) {
                groups.push(group);

                var wires = group.getWires();

                var gindex = this.wireGroups.indexOf(group);
                this.wireGroups.splice(gindex, 1);
                group.removeAllOutputs();
                
                for (var i = 0; i < wires.length; ++ i)
                {
                    var w = wires[i];
                    if (!toRemove.contains(w)) {
                        this.placeWire(w.start, w.end);
                    }
                }
            }
        }
    }

    this.render = function(context, offset, selectClr)
    {
        if (offset == null) {
            offset = new Pos(0, 0);
        }

        for (var i = 0; i < this.wireGroups.length; ++ i)
            this.wireGroups[i].render(context, offset, selectClr);
            
        for (var i = 0; i < this.gates.length; ++ i)
            this.gates[i].render(context, offset, selectClr);
    }
}
