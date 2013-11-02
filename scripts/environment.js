function Environment()
{    
    this.gates = new Array();
    this.wireGroups = new Array();

    this.clear = function()
    {
        this.gates = new Array();
        this.wireGroups = new Array();
    }

    this.save = function()
    {
        var obj = { gates: [], wires: [] };

        for (var i = 0; i < this.gates.length; ++i)
        {
            var gate = this.gates[i];
            var gobj = {
                t: gate.type.ctorname,
                x: gate.x,
                y: gate.y,
                o: gate.getOutputs(),
                d: gate.saveData()
            };

            if (gobj.t == "CustomIC") {
                gobj.i = logicSim.customGroup.items.indexOf(gate.type);
                gobj.e = gate.environment.save();
            }

            obj.gates.push(gobj);
        }

        for (var i = 0; i < this.wireGroups.length; ++i)
        {
            var wires = this.wireGroups[i].getWires();
            for (var j = 0; j < wires.length; ++j)
            {
                var wire = wires[j];
                obj.wires.push({
                    sx: wire.start.x,
                    sy: wire.start.y,
                    ex: wire.end.x,
                    ey: wire.end.y
                });
            }
        }

        return obj;
    }

    this.load = function(obj, ics)
    {
        for (var i = 0; i < obj.gates.length; ++i)
        {
            var info = obj.gates[i];
            var gate = null;

            if (info.t == "CustomIC") {
                gate = new Gate(ics[info.i], info.x, info.y);
                var env = new Environment();
                env.load(info.e, ics);
                gate.environment = env;
            } else {
                var ctor = window[info.t];
                gate = new Gate(new ctor(), info.x, info.y);
            }

            this.placeGate(gate);
            gate.setOutputs(info.o);
            gate.loadData(info.d);
        }

        for (var i = 0; i < obj.wires.length; ++i)
        {
            var info = obj.wires[i];
            this.placeWire(new Pos(info.sx, info.sy), new Pos(info.ex, info.ey));
        }
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

    var myIOSort = function (a, b) {
        if (a.y < b.y) return -1;
        if (a.y == b.y) return a.x < b.x ? -1 : a.x == b.x ? 0 : 1;
        return 1;
    }

    this.getInputs = function()
    {
        var inputs = new Array();
        for (var i = 0; i < this.gates.length; ++i) {
            var gate = this.gates[i];
            if (gate.type.ctorname == "ICInput") {
                inputs.push(gate);
            }
        }

        return inputs.sort(myIOSort);
    }

    this.getOutputs = function()
    {
        var outputs = new Array();
        for (var i = 0; i < this.gates.length; ++i) {
            var gate = this.gates[i];
            if (gate.type.ctorname == "ICOutput") {
                outputs.push(gate);
            }
        }

        return outputs.sort(myIOSort);
    }

    this.tryMerge = function(env, offset, selected, shallow)
    {
        if (offset == null) offset = new Pos(0, 0);
        if (selected == null) selected = false;
        if (shallow == null) shallow = false;

        for (var i = 0; i < env.gates.length; ++i) {
            var gate = env.gates[i].clone(shallow);
            gate.x += offset.x;
            gate.y += offset.y;
            gate.selected = selected;
            if (!this.canPlaceGate(gate)) return false;
            this.placeGate(gate);
        }

        var wires = env.getAllWires();
        for (var i = 0; i < wires.length; ++i) {
            var wire = wires[i];
            wire = new Wire(wire.start.add(offset), wire.end.add(offset));
            if (!this.canPlaceWire(wire)) return false;
            this.placeWire(wire.start, wire.end, selected);
        }

        return true;
    }

    this.getAllWires = function()
    {
        var wires = [];
        for (var i = this.wireGroups.length - 1; i >= 0; i--) {
            wires.pushMany(this.wireGroups[i].getWires());
        }

        return wires;
    }

    this.deselectAll = function()
    {
        for (var i = this.gates.length - 1; i >= 0; --i) {
            this.gates[i].selected = false;
        }

        var wires = this.getAllWires();
        for (var i = wires.length - 1; i >= 0; --i) {
            wires[i].selected = false;
        }
    }
    
    this.canPlaceGate = function(gate)
    {
        var rect = gate.getRect();

        if (rect.x < 256) return false;
        
        for (var i = 0; i < this.gates.length; ++i) {
            var other = this.gates[i].getRect();
            
            if (rect.intersects(other)) return false;
        }
        
        var crossed = false;
        for (var i = 0; i < this.wireGroups.length; ++ i) {
            var group = this.wireGroups[i];
            var wires = group.getWires();

            for (var j = 0; j < wires.length; ++ j) {
                var wire = wires[j];
                if (wire.start.x < rect.right && wire.end.x > rect.left
                    && wire.start.y <= rect.bottom && wire.end.y >= rect.top)
                    return false;
            }

            for (var j = 0; j < gate.outputs.length; ++ j) {
                var out = gate.outputs[j];
                if (group.crossesPos(out.getPosition(gate.type, gate.x, gate.y))) {
                    if (crossed || group.input != null) return false;
                    
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
    
        for (var i = 0; i < this.gates.length; ++ i) {
            var other = this.gates[i];
            var r1 = other.getRect(logicSim.getGridSize());
            
            if (r0.left == r1.right || r1.left == r0.right
                || r0.top == r1.bottom || r1.top == r0.bottom) {               
                for (var j = 0; j < gate.inputs.length; ++ j) {
                    var inp = gate.inputs[j];
                    for (var k = 0; k < other.outputs.length; ++ k) {
                        var out = other.outputs[k];
                        
                        if (inp.getPosition(gate.type, gate.x, gate.y).equals(
                            out.getPosition(other.type, other.x, other.y))) {
                            gate.linkInput(other, out, inp);
                        }
                    }
                }
                
                for (var j = 0; j < gate.outputs.length; ++ j) {
                    var out = gate.outputs[j];
                    for (var k = 0; k < other.inputs.length; ++ k) {
                        var inp = other.inputs[k];
                        
                        if (out.getPosition(gate.type, gate.x, gate.y).equals(
                            inp.getPosition(other.type, other.x, other.y))) {
                            other.linkInput(gate, out, inp);
                        }
                    }
                }
            }
        }
        
        for (var i = 0; i < this.wireGroups.length; ++ i) {
            var group = this.wireGroups[i];
                    
            for (var j = 0; j < gate.inputs.length; ++ j) {
                var pos = gate.inputs[j].getPosition(gate.type, gate.x, gate.y);
                
                if (group.crossesPos(pos)) group.addOutput(gate, gate.inputs[j]);
            }
            
            for (var j = 0; j < gate.outputs.length; ++ j) {
                var pos = gate.outputs[j].getPosition(gate.type, gate.x, gate.y);
                
                if (group.crossesPos(pos)) group.setInput(gate, gate.outputs[j]);
            }
        }
        
        this.gates.push(gate);
    }
    
    this.removeGate = function(gate)
    {
        var index = this.gates.indexOf(gate);
        this.gates.splice(index, 1);
        
        for (var i = 0; i < this.gates.length; ++ i) {
            if (this.gates[i].isLinked(gate)) {
                this.gates[i].unlinkGate(gate);
            }

            if (gate.isLinked(this.gates[i])) {
                gate.unlinkGate(this.gates[i]);
            }
        }
        
        for (var i = 0; i < this.wireGroups.length; ++ i) {
            var group = this.wireGroups[i];
            
            if (group.input != null && group.input.gate == gate) {
                group.input = null;
            }
                
            for (var j = group.outputs.length - 1; j >= 0; -- j) {
                if (group.outputs[j].gate == gate) {
                    group.outputs.splice(j, 1);
                }
            }
        }
    }

    this.canPlaceWire = function(wire)
    {
        var input = null;

        if (wire.start.x < 256) return false;
        
        for (var i = 0; i < this.wireGroups.length; ++ i) {
            var group = this.wireGroups[i];
            
            if (group.canAddWire(wire)) {
                if (wire.start.equals(wire.end)) return false;

                if (group.input != null) {
                    if (input != null && !group.input.equals(input)) {
                        return false;
                    }
                    
                    input = group.input;
                }
            }
        }
        
        for (var i = 0; i < this.gates.length; ++ i) {
            var gate = this.gates[i];
            var rect = gate.getRect(logicSim.getGridSize());

            if (wire.start.x < rect.right && wire.end.x > rect.left
                && wire.start.y <= rect.bottom && wire.end.y >= rect.top) {
                return false;
            }
            
            if (wire.start.x == rect.right || rect.left == wire.end.x
                || wire.start.y == rect.bottom || rect.top == wire.end.y) {
                for (var j = 0; j < gate.outputs.length; ++ j) {
                    var inp = new Link(gate, gate.outputs[j]);
                    var pos = gate.outputs[j].getPosition(gate.type, gate.x, gate.y);
                    
                    if (wire.crossesPos(pos)) {
                        if (input != null && !inp.equals(input)) return false;
                        
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
            return;
        }

        // Here we go...

        selected = selected != null ? true : false;
        var wire = new Wire(start, end);
        wire.selected = selected;

        var group = new WireGroup();
        group.addWire(wire);

        // Check for gate input / output intersections
        for (var i = 0; i < this.gates.length; ++ i) {
            var gate = this.gates[i];
            var rect = gate.getRect(logicSim.getGridSize());
            
            if (wire.start.x == rect.right || rect.left == wire.end.x
                || wire.start.y == rect.bottom || rect.top == wire.end.y) {               
                for (var j = 0; j < gate.inputs.length; ++ j) {
                    var pos = gate.inputs[j].getPosition(gate.type, gate.x, gate.y);
                    
                    if (wire.crossesPos(pos)) {
                        wire.group.addOutput(gate, gate.inputs[j]);
                    }
                }
                
                for (var j = 0; j < gate.outputs.length; ++ j) {
                    var pos = gate.outputs[j].getPosition(gate.type, gate.x, gate.y);
                    
                    if (wire.crossesPos(pos)) {
                        wire.group.setInput(gate, gate.outputs[j]);
                    }
                }
            }
        }

        // Find all wire groups that are connected to the new wire, and
        // dump their wires, input and outputs into the new group
        var wires = null;
        for (var i = this.wireGroups.length - 1; i >= 0; -- i) {
            var oldGroup = this.wireGroups[i];
            if (oldGroup.canAddWire(wire)) {
                this.wireGroups.splice(i, 1);

                wires = oldGroup.getWires();
                for (var j = 0; j < wires.length; ++ j) {
                    var newWire = new Wire(wires[j].start, wires[j].end);
                    newWire.selected = wires[j].selected;
                    group.addWire(newWire);
                }
                
                if (oldGroup.input != null) {
                    group.setInput(oldGroup.input.gate, oldGroup.input.socket);
                }

                for (var j = 0; j < oldGroup.outputs.length; ++ j) {
                    group.addOutput(oldGroup.outputs[j].gate, oldGroup.outputs[j].socket);
                }
            }
        }

        // Merge wires that run along eachother
        wires = group.getWires();
        for (var i = wires.length - 1; i >= 0; -- i) {
            var w = wires[i];
            for (var j = i - 1; j >= 0; -- j) {
                var other = wires[j];

                if (w.runsAlong(other)) {
                    w.merge(other);
                    wires.splice(j, 1);
                    break;
                }
            }
        }

        // Split at intersections
        for (var i = 0; i < wires.length; ++ i) {
            var w = wires[i];
            for (var j = i + 1; j < wires.length; ++ j) {
                var other = wires[j];

                if (w.isHorizontal() == other.isHorizontal()) continue;

                if (w.intersects(other)) {
                    wires.pushMany(w.split(other));
                    wires.pushMany(other.split(w));
                }
            }
        }

        // Connect touching wires
        for (var i = 0; i < wires.length; ++ i) {
            var w = wires[i];
            for (var j = i + 1; j < wires.length; ++ j) {
                var other = wires[j];

                if (w.intersects(other)) {
                    w.connect(other);
                    other.connect(w);
                }
            }
        }

        // Add the new group to the environment
        this.wireGroups.push(group);
    }
    
    this.removeWire = function(wire)
    {
        this.removeWires([wire]);
    }

    this.removeWires = function(toRemove)
    {
        var survivors = new Array();

        for (var i = 0; i < toRemove.length; ++ i) {
            var group = toRemove[i].group;
            if (this.wireGroups.contains(group)) {
                var wires = group.getWires();

                for (var j = 0; j < wires.length; ++ j) {
                    var w = wires[j];
                    if (!toRemove.containsEqual(w)) {
                        survivors.push({start: w.start, end: w.end});
                    }
                }

                var gindex = this.wireGroups.indexOf(group);
                this.wireGroups.splice(gindex, 1);
                group.removeAllOutputs();
            }
        }

        for (var i = 0; i < survivors.length; ++ i) {
            this.placeWire(survivors[i].start, survivors[i].end);
        }
    }

    this.step = function()
    {
        for (var i = 0; i < this.gates.length; ++ i) {
            this.gates[i].step();
        }
            
        for (var i = 0; i < this.gates.length; ++ i) {
            this.gates[i].commit();
        }
    }

    this.render = function(context, offset, selectClr)
    {
        if (offset == null) {
            offset = new Pos(0, 0);
        }

        for (var i = 0; i < this.wireGroups.length; ++ i) {
            this.wireGroups[i].render(context, offset, selectClr);
        }

        for (var i = 0; i < this.gates.length; ++ i) {
            this.gates[i].render(context, offset, selectClr);
        }
    }
}
