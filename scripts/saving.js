Saving = new Object();
Saving.save = function()
{
    var obj = { gates: [], wires: [] };

    for (var i = 0; i < logicSim.gates.length; ++i)
    {
        var gate = logicSim.gates[i];
        obj.gates.push({
            t: gate.type.ctorname,
            x: gate.x,
            y: gate.y,
            o: gate.getOutputs(),
            d: gate.saveData()
        });
    }

    for (var i = 0; i < logicSim.wireGroups.length; ++i)
    {
        var wires = logicSim.wireGroups[i].getWires();
        for (var j = 0; j < wires.length; ++j)
        {
            var wire = wires[j];
            alert(wire.getConnections().length);
            obj.wires.push({
                sx: wire.start.x,
                sy: wire.start.y,
                ex: wire.end.x,
                ey: wire.end.y
            });
        }
    }

    var str = LZString.compressToBase64(JSON.stringify(obj));
    window.location.href = "#" + str;
}

Saving.load = function()
{
    if (window.location.hash === null || window.location.hash.length <= 1) return;

    var str = window.location.hash.substring(1);
    var obj = JSON.parse(LZString.decompressFromBase64(str));

    for (var i = 0; i < obj.gates.length; ++i)
    {
        var info = obj.gates[i];
        var ctor = window[info.t];
        var gate = new Gate(new ctor(), info.x, info.y);
        logicSim.placeGate(gate);
        gate.setOutputs(info.o);
        gate.loadData(info.d);
    }

    for (var i = 0; i < obj.wires.length; ++i)
    {
        var info = obj.wires[i];
        logicSim.placeWire(new Pos(info.sx, info.sy), new Pos(info.ex, info.ey));
    }
}
