/*
 * This file is provided for custom JavaScript logic that your HTML files might need.
 * Maqetta includes this JavaScript file by default within HTML pages authored in 
 * Maqetta.
 */
require(["dojo/ready", 
        "dojo/dom", 
        "dojo/dom-style", 
        "dijit/registry", 
        "dojo/on", 
        "dojo/date/stamp",
        "dojo/data/ItemFileWriteStore"], 
function(ready, 
         dom, 
         domStyle, 
         registry,
         on, 
         stamp,
         ItemFileWriteStore){

    ready(function(){
        // logic that requires that Dojo is fully initialized should go here

        /* *******************************************
         * Get a reference to all the widgets we need
         *********************************************/
        var weightList = registry.byId("weightList");
        var mainView = registry.byId("mainView");
        var detailsView = registry.byId("detailsView");
        var detailsView_Date = registry.byId("detailsView_Date");
        var detailsView_Notes = registry.byId("detailsView_Notes"); 
        var weightSpinWheel = registry.byId("weightSpinWheel");
        var dateListItem = registry.byId("dateListItem");
        var notesListItem = registry.byId("notesListItem");
        var dateSpinWheel = registry.byId("dateSpinWheel");
        var notesTextArea = registry.byId("notesTextArea");
        var addWeightButton = registry.byId("addWeightButton");
       
        // Make sure we found all of the widgets
        if (!weightList || 
            !mainView || 
            !detailsView || 
            !detailsView_Date || 
            !detailsView_Notes || 
            !weightSpinWheel || 
            !dateListItem || 
            !notesListItem || 
            !dateSpinWheel || 
            !notesTextArea || 
            !addWeightButton) {
            
            // show an error to make it easier to figure out
            // which widget(s) could not be found
            alert("could not find at least one of the widgets:\n" + 
                "\t weightList = " +  weightList + ",\n" + 
                "\t mainView = " +  mainView + ",\n" +
                "\t detailsView = " +  detailsView + ",\n" +
                "\t detailsView_Date = " +  detailsView_Date + ",\n" +
                "\t detailsView_Notes = " +  detailsView_Notes + ",\n" +
                "\t weightSpinWheel = " +  weightSpinWheel + ",\n" +
                "\t dateListItem  = " +  dateListItem + ",\n" +
                "\t notesListItem = " +  notesListItem + ",\n" +
                "\t dateSpinWheel = " +  dateSpinWheel + ",\n" + 
                "\t notesTextArea = " +  notesTextArea + ",\n" +
                "\t addWeightButton = " +  addWeightButton);
                
            // return, so don't run any other JavaScript
            return;
        }

        /* *******************************************
         * Replace ItemFileReadStore generated by
         * Maqetta with ItemFileWriteStore
         *********************************************/
        var weightWriteStore = new ItemFileWriteStore({
            url:"weights.json"
        });
        weightList.setStore(weightWriteStore);

        /* *******************************************
         * Provide placeholder for the weight data
         * currently being edited.
         ********************************************/
        var selectedWeightData = null; 

        /* *******************************************
         * Function to be called when item in the 
         * EdgeToEdgeDataList is clicked.
         ********************************************/
        var listItemClick = function(dojoListItem) {
            // Fill in selected weight data based on selected item
            selectedWeightData = {
                id: dojoListItem.params.id,
                label: dojoListItem.params.label,
                rightText: dojoListItem.params.rightText,
                notes: dojoListItem.params.notes,
            };
    
            //Perform the transition
            dojoListItem.transitionTo("detailsView");                    
        };

        /* *******************************************
         * When weight list is clicked, we want to 
         * find the Dojo ListItem that was actually
         * targeted by the user and handle the click.
         ********************************************/
        on(weightList, "click", 
            function(event) {
                // The event's "target" will be the list's
                // sub-element what was clicked. (The 
                // event's "currentTarget" should be the list
                // itself.
                var subElement = event.target;

                // The subElement of the list may be an LI or 
                // a child of an LI element. If not an LI,
                // we want to search the anscestry of the
                // subElement to find the LI.
                var parent = subElement.parentNode;
                while (parent != null && parent.nodeName != "LI") {
                    parent = parent.parentNode;
                }

                if (parent) {
                    // If parent is set, then we've found the LI. From
                    // there we can use the id to get the Dojo ListItem.
                    var dojoListItem = registry.byId(parent.id);

                    // Handle the click
                    listItemClick(dojoListItem);
                }
        });

        /* *******************************************
         * detailsView Transitions
         *********************************************/	 
        on(detailsView, "beforeTransitionIn", 
            function(){
                if (selectedWeightData) {
                    // Get the slots from the spin wheel
                    var weightSpinWheelSlots = weightSpinWheel.getSlots();

                    // Loop over digits in weight to set value for each slot in the
                    // spin wheel. For simplicity (and this is a prototype 
                    // after all) assuming all weight labels have a string length 
                    // of 3 (e.g., weight > 100)
                    for (var i = 0; i < 3; i++) {
                        var char = selectedWeightData.label.charAt(i);
                        weightSpinWheelSlots[i].set("value", char);
                    }

                    // Update the date list item
                    dateListItem.set("rightText", selectedWeightData.rightText);

                    // Update the notes list item
                    notesListItem.set("rightText", selectedWeightData.notes);

                    // Update styling of notesListItem's rightTextNode so that
                    // it's the same width as the date label and will automtically
                    // add an ellipsis for us. The settings for whiteSpace,
                    // overflow, and textOverflow are static, so they technically
                    // should go in app.css and override the "mblListItemRightText"
                    // style class.
                    var width = 
                           Math.round(domStyle.get(dateListItem.rightTextNode, "width"));
                    domStyle.set(notesListItem.rightTextNode, "width", width + "px");
                    domStyle.set(notesListItem.rightTextNode, "whiteSpace", "nowrap");
                    domStyle.set(notesListItem.rightTextNode, "overflow", "hidden");
                    domStyle.set(notesListItem.rightTextNode, 
                            "textOverflow", "ellipsis");
                }
        });

	    on(detailsView, "beforeTransitionOut", 
            function(){
                if (selectedWeightData) {
                    // Get the slots from the spin wheel
                    var weightSpinWheelSlots = weightSpinWheel.getSlots();

                    // Build up the new label for weight from the weight spin wheel slots
                    var newLabel = "";
                    for (var i = 0; i < weightSpinWheelSlots.length; i++) {
                        newLabel += weightSpinWheelSlots[i].get("value");
                    }

                    // Update selected weight data
                    selectedWeightData.label = newLabel;
                }
        });

        /* *******************************************
         * detailsView_Date Transitions
         *********************************************/
        on(detailsView_Date, "beforeTransitionIn", 
            function(){
                if (selectedWeightData) {
                    // NOTE: Date spin wheel expects an ISO date (which is 
                    // what we've been putting in rightText)
                    dateSpinWheel.set("value", selectedWeightData.rightText);
                }
        });

	    on(detailsView_Date, "beforeTransitionOut", 
            function(){
                if (selectedWeightData) {
                    // Get value from the spint wheel
                    var value = dateSpinWheel.get("value");

                    // Update selected weight data
                    selectedWeightData.rightText = value;
                }
        });

        /* *******************************************
         * detailsView_Notes Transitions
         *********************************************/
        on(detailsView_Notes, "beforeTransitionIn", 
            function(){
                if (selectedWeightData) { 
                    notesTextArea.set("value", selectedWeightData.notes);
                }
        });

        on(detailsView_Notes, "beforeTransitionOut", 
            function(){
                if (selectedWeightData) {
                    // Get value from the text area
                    var value = notesTextArea.get("value");

                    // Update selected weight data
                    selectedWeightData.notes = value;
                }
        });

        /* *******************************************
         * mainView transition
         *********************************************/
        on(mainView, "beforeTransitionIn",
            function(){
                if (selectedWeightData) {
                    weightWriteStore.fetchItemByIdentity({
                        identity: selectedWeightData.id,
                        onItem: function(item) {
                            // We've retrieved the item we want to edit, so 
                            // update it in the weight list data store
                            weightWriteStore.setValue(item, "label", 
                                selectedWeightData.label);
                            weightWriteStore.setValue(item, "rightText", 
                                selectedWeightData.rightText);
                            weightWriteStore.setValue(item, "notes", 
                                selectedWeightData.notes);

                            // Force weight list to reload the data store
                            weightList.setStore(null); 
                            weightList.setStore(weightWriteStore);

                            //Clear out the selected weight data
                            selectedWeightData = null;
                        },
                        onError: function(error) {
                            // TODO: in production environment, would want to do 
                            // something with error
                            console.error("fetchItemByIdentity failed!");
                        }
                    });
                }
        });

        /* *******************************************
         * Handle addWeightButton
         ********************************************/
        var addWeightCounter = 0;
        on(addWeightButton, "click", function() {
            // Generate a unique id for the new item
            var newWeightId = "newWeight_" + addWeightCounter++;
            
            // Fill in some default data for the new item
            var newWeightData = {
                id: newWeightId,
                moveTo: "detailsView",
                //Default to 150, but production code would use most recent weight
                label: "150", 
                //Default rightText to today's date
                rightText: stamp.toISOString(new Date(), {selector: 'date'}), 
                //Default notes to empty string
                notes: ""
            };
                 
            // Set the selected weight data to data for new item
            selectedWeightData = newWeightData;

            // Add new item to the data store. NOTE: We're keeping this simple for 
            // the prototype and just always adding the new item to the data store. 
            // That is, we're not considering possibility of user canceling the
            // operation.
            weightWriteStore.newItem(newWeightData);
        });
    });
});
