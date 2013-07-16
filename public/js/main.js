function showAlertWithText(headline, text, confirmation, callback) {
    var content = '<div class="alert alert-block alert-error fade in">'
                +'<h4 class="alert-heading">' + headline + '</h4>'
                +'<p>' + text + '</p>'
                +'<p>'
                +  '<a class="btn btn-danger btn-alert-cancel" href="#">Cancel</a> <a class="btn btn-alert-confirm" href="#">'+ confirmation +'</a>'
                +'</p>'
              +'</div>';

    $('#popup-container').html(content);
    $('#popup-container').fadeIn();

    $('.btn-alert-cancel').click(function(){
        $('#popup-container').hide();        
        callback(false);
    });

    $('.btn-alert-confirm').click(function(){
        $('#popup-container').hide();
        callback(true);
    });
}

$(function() {

    $('.alert-fadeout').delay(5000).fadeOut({
        complete: function(){
            $(this).remove();
        }
    });

/********************
 * TABLESORT
 ********************/

    // add parser through the tablesorter addParser method 
    $.tablesorter.addParser({ 
        // set a unique id 
        id: 'priority', 
        is: function(s) { 
            // return false so this parser is not auto detected 
            return false; 
        }, 
        format: function(s) {
            // format your data for normalization 
            return s.toLowerCase().replace(/immediate/,3).replace(/high/,2).replace(/normal/,1).replace(/low/,0); 
        }, 
        // set type, either numeric or text 
        type: 'numeric'
    }); 


    $(".table-sortable").tablesorter({
        cssAsc:"sort-asc",
        cssDesc:"sort-desc",
        cssHeader:"table-indicator"
    }); 
    
    $("#table-issues").tablesorter({
        cssAsc:"sort-asc",
        cssDesc:"sort-desc",
        cssHeader:"table-indicator",
        headers: { 
            1: { 
                sorter:'priority'
            } 
        } 
    }); 

/********************
 * TABLE CALENDAR
 ********************/

    $('.table-calendar').tableHover({colClass: 'cell-calendar-active', headCols: true}); 


/********************
 * AutoSuggestions
 ********************/
    $(".input-users").autoSuggest('/users/getAll', {
        asHtmlID: 'user_ids',
        selectedItemProp: "email",
        searchObjProps: "email",
        selectedValuesProp: "id",
        startText: "search by email"
    });

/********************
 * Forms: Confirm Deletion
 ********************/
    $("#form-delete-project").submit(function(event){
        event.stopPropagation();
        event.preventDefault();

        console.log(event);
        
        function callback(result) {
            console.log(result);
            console.log(event.target.action);
            console.log($('form-delete-projectId'));
        }

        // show popup
        showAlertWithText("Delete project", "Do you really want to delete this project?", "Delete", callback);
    });
});
