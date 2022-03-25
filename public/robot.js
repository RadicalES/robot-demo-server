
element.classList.remove("mystyle");
document.getElementById("myElementID").classList.remove("class_name"); 
$(#id).hide

$('#id').hide();
$('#id').show();
An alternate way is to use the jQuery css method:

$("#id").css("display", "none");
$("#id").css("display", "block");

$('#ele_id').css({
    display: 'none'
    height: 100px,
    width: 100px
});
$('#ele_id').css({
    display: 'block'
    height: 100px,
    width: 100px
});

To dynamically toggle between block and none, if it's a div

some elements are displayed as inline, inline-block, or table, depending on the Tag Name
$('#ele_id').toggle();

$("#id").css({display: "none"});
$("#id").css({display: "block"});

function displayChange(){
    $(content_id).click(function(){
      $(elem_id).toggle();}
    
    )}


    $(#id/.class).show()
    $(#id/.class).hide()