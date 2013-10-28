Saving = new Object();
Saving.save = function()
{
    var obj = { ics: [], root: logicSim.save() };

    for (var i = 0; i < logicSim.customGroup.items.length; ++i) {
        var ic = logicSim.customGroup.items[i];
        obj.ics.push({ name: ic.name, env: ic.environment.save() });
    }

    var str = LZString.compressToBase64(JSON.stringify(obj));

    window.open("data:text/plain;charset=UTF-8," + str, "_blank");
}

Saving.loadFromHash = function()
{
    if (window.location.hash === null || window.location.hash.length <= 1) return;
    Saving.load(window.location.hash.substring(1));
}

Saving.loadFromPrompt = function()
{
    var str = prompt("Paste a previously copied save code with Ctrl+V.", "");
    if (str != null && str.length > 0) Saving.load(str);
}

Saving.load = function(str)
{
    var obj = JSON.parse(LZString.decompressFromBase64(str));

    var ics = new Array();
    for (var i = 0; i < obj.ics.length; ++ i) {
        var ic = obj.ics[i];
        var env = new Environment();
        env.load(ic.env, ics);
        ics[i] = new CustomIC(ic.name, env);
        logicSim.customGroup.addItem(ics[i]);
    }

    logicSim.load(obj.root, ics);
}
