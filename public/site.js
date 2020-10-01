window.onload = function() {

    // load 
	$("#home").click(() => {
        showLayer('layerHome');
    });

    $("#robots").click(() => {
        showLayer('layerRobot');
    });

    $("#dd-contact").click(() => {
        showLayer('layerContact');
    });

    $("#dd-resources").click(() => {
        showLayer('layerResources');
    });

    $("#dd-config").click(() => {
        showLayer('layerConfig');
    });

    showLayer('layerHome');
}


function showLayer(ln) {

    if(ln == "layerHome") {
        $('#layerHome').show();
        $('#layerContact').hide();
        $('#layerRobot').hide();
        $('#layerResources').hide();
        $('#layerConfig').hide();
    }
    else if(ln == "layerRobot") {
        $('#layerHome').hide();
        $('#layerContact').hide();
        $('#layerRobot').show();
        $('#layerResources').hide();
        $('#layerConfig').hide();
    }
    else if(ln == "layerContact") {
        $('#layerHome').hide();
        $('#layerContact').show();
        $('#layerRobot').hide();
        $('#layerResources').hide();
        $('#layerConfig').hide();
    }
    else if(ln == "layerConfig") {
        $('#layerHome').hide();
        $('#layerContact').hide();
        $('#layerRobot').hide();
        $('#layerResources').hide();
        $('#layerConfig').show();
    }
    else if(ln == "layerResources") {
        $('#layerHome').hide();
        $('#layerContact').hide();
        $('#layerRobot').hide();
        $('#layerResources').show();
        $('#layerConfig').hide();
    }
}
