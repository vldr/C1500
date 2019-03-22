//............................................................ Program constants
var maxInstr = 30;              // maximum number of instructions
var currInstr = 40;             // current number of instructions
var maxMemory = 10;             // maximum memory addresses
//.................................................................... registers
var regA = 'null';              // the A register
var regB = 'null';              // the B register
var regResult = 'null';         // the Result register
var PC = 1;                     // the Program Counter
//.......................................................... instruction storage
var operationTable = [];        // opcodes
var operandTable = [];       // operands
var destinationTable = [];   // destination addresses

//.......................................................... tab storage
var tabTable = []; // Our tab table...
var activeTab = 0; // Our active tab...

//............................................................... memory storage
var memoryTable = [];
//............................................ GETINPUT implementation variables
var waitingForInput = false;
var inputAddress = 0;
//............................................................ initialize tables
for (i = 0; i < maxMemory; i++) memoryTable[i] = null;

/**
 * Our return stack register...
 */
let returnStack = [];

//************************************************************************** Functions

/**
 * advancePC
 * Advance the Program Counter and redraw the arrow pointer
 * @param {String} dest The destination position... ex: C1, C15, etc.
 */
function advancePC(dest) 
{
    // Check if the position is greater than the current instructions...
    if (PC > currInstr) return;

    // Set our current position indicator to a blank...
    document.getElementById('C' + PC + 'PC').innerHTML = ``;
    
    // Set our cursor to the new destination position...
    PC = dest;

    // Set our new position indicator to a arrow...
    document.getElementById('C' + PC + 'PC').innerHTML = '==>';
}

/**
 * completeGetInput
 * Complete the processing for the GETINPUT command.
 * @param {String} line The line that the instruction is on... ex: C1, C15, etc...
 */
function completeGetInput(line) 
{
    // Check if we are even waiting for any input...
    if (!waitingForInput) return;

    // Setup the input by parsing it to a integer...
    theInput = parseInt(document.getElementById('input').value);

    // Set the register result to reflect the input... (so you can JUMPIFZERO directly)
    document.getElementById('registerResult').value = parseInt(document.getElementById('input').value);

    // Set our IO messages to be blank...
    document.getElementById('iomessages').innerHTML = ``;

    // Set the value of the memory according to the input...
    memoryTable[inputAddress] = theInput;

    // Rerender our memory table...
    HTMLmemoryTable();

    // Advance our cursor...
    advancePC(PC + 1);

    // Remove the input value...
    document.getElementById('input').value = null;

    // Reset our waitingForInput...
    waitingForInput = false;
}

/**
 * executeCurrent
 * Execute the current instruction
 */
function executeCurrent() 
{
    // Check if the user is waiting for input...
    if (waitingForInput) 
    {
        // If our input is valid then complete the input.
        if (validateInput(document.getElementById('input').value)) completeGetInput()
    }

    opcode = document.getElementById('C' + PC + 'opcode').value;
    operand = 'C' + PC + 'operand';
    address = 'C' + PC + 'address';
    destination = 'C' + PC + 'destination';
    
    switch (opcode) 
    {
        case "STORE":
            theValue = parseInt(document.getElementById(operand).value);
            theAddress = parseInt(document.getElementById(address).value);
            operandTable[theAddress] = theValue;
            memoryTable[theAddress] = theValue;
            HTMLmemoryTable();
            advancePC(PC + 1);
            break;
        case "GETA":
        case "GETB":
            theAddress = parseInt(document.getElementById(address).value);
            theValue = memoryTable[theAddress];
            if (opcode == 'GETA')
                document.getElementById('registerA').value = theValue;
            else
                document.getElementById('registerB').value = theValue;
            advancePC(PC + 1);
            break;
        case "ADD":
        case "SUB":
        case "MULT":
        case "DIV":
        case "REM":
            answer = 0;
            opA = parseInt(document.getElementById('registerA').value);
            opB = parseInt(document.getElementById('registerB').value);
            if (opcode == "ADD")
                answer = opA + opB;
            else if (opcode == "SUB")
                answer = opA - opB;
            else if (opcode == "MULT")
                answer = opA * opB;
            else if (opcode == "DIV")
                answer = intDiv(opA, opB);
            else if (opcode == "REM")
                answer = opA % opB;
            else
                document.getElementById("Messages").innerHTML =
                    'Opcode ' + opcode + ' not supported';

            document.getElementById('registerResult').value = answer;
            advancePC(PC + 1);
            break;
        case "SAVE":
            theValue = document.getElementById('registerResult').value;
            theAddress = parseInt(document.getElementById(address).value);
            operandTable[theAddress] = theValue;
            memoryTable[theAddress] = theValue;
            HTMLmemoryTable();
            advancePC(PC + 1);
            break;
        case "GETINPUT":
            waitingForInput = true;
            document.getElementById('input').focus();
            document.getElementById('iomessages').innerHTML = 'Enter your input...';
            inputAddress = parseInt(document.getElementById(address).value);
            // the rest is done by completeGetInput
            break;
        case "OUTPUT":
            theAddress = parseInt(document.getElementById(address).value);
            theValue = memoryTable[theAddress];
            document.getElementById('output').value = theValue;
            advancePC(PC + 1);
            break;
        case "INC": 
        case "DEC": 
        {
            // Setup our address...
            let position = parseInt(document.getElementById(address).value);

            // Check if the memory in the address is null, then decrement it...
            if (memoryTable[position] !== null) 
            {
                // Update our memory table value...
                memoryTable[position] = memoryTable[position] + (opcode === "INC" ? 1 : -1);

                // Setup our result in the result register...
                document.getElementById('registerResult').value = memoryTable[position];

                // Rerender our memory...
                HTMLmemoryTable();
            }

            // Advance our pc...
            advancePC(PC + 1);

            // Break here...
            break;
        }
        case "GOSUB": 
        {
            // Setup our destination...
            let position = document.getElementById(destination).value.substring(1);

            // Store our one ahead of the current location in the stack...
            returnStack.push(PC + 1)

            // Advance to the location...
            advancePC(parseInt(position));

            // Break here...
            break;
        }
        case "RETURN": 
        {
            // Check if our stack isn't empty...
            if (returnStack.length === 0) break;
               
            // Advance to the previous location...
            advancePC(returnStack.pop());

            // Break here...
            break;
        }
        case "JUMP":
        case "JUMPIFZERO":      
        case "JUMPIFNOTZERO":      
            whereTo = document.getElementById(destination).value.substring(1);
            result = document.getElementById('registerResult').value;
            document.getElementById("Messages").innerHTML = whereTo + "&nbsp;" + result;
            if (opcode == "JUMP" 
            || (opcode === "JUMPIFZERO" && result === "0") 
            || (opcode === "JUMPIFNOTZERO" && result !== "0")) advancePC(parseInt(whereTo));
            else advancePC(PC + 1);

            break;
        case "NONE":
            advancePC(PC + 1);
            break;
        default:
            document.getElementById("Messages").innerHTML =
                'Opcode ' + opcode + ' not supported';
    }
}

/**
 * generateOpCodeFields
 * Generate form fields required for a chosen opcode.
 * @param {String} line The line that the instruction is on... ex: C1, C15, etc...
 * @param {Boolean} renderSaving Determines whether to render the saving dialog in the top right...
 */
function generateOpCodeFields(line, renderSaving = true) {
    operand = line + "operandTD";
    address = line + "addressTD";
    document.getElementById(operand).innerHTML = '&nbsp;';
    document.getElementById(address).innerHTML = '&nbsp;';
    opcode = document.getElementById(line + "opcode").value;

    setupObject(line, opcode, renderSaving);

    switch (opcode) 
    {
        case "STORE":
            document.getElementById(operand).innerHTML = HTMLoperandField(line);
            document.getElementById(address).innerHTML = HTMLaddressField(line);
            break;
        case "SAVE":
        case "GETA":
        case "GETB":
        case "GETINPUT":
        case "INC":
        case "DEC":
        case "OUTPUT":
            document.getElementById(operand).innerHTML = '&nbsp;';
            document.getElementById(address).innerHTML = HTMLaddressField(line);
            break;
        case "NONE":
        case "ADD":
        case "SUB":
        case "MULT":
        case "DIV":
        case "REM":
            document.getElementById(operand).innerHTML = "&nbsp;";
            document.getElementById(address).innerHTML = "&nbsp;";
            break;
        case "JUMP":
        case "JUMPIFZERO":
        case "JUMPIFNOTZERO":
        case "GOSUB":
            document.getElementById(operand).innerHTML = '&nbsp;';
            document.getElementById(address).innerHTML = HTMLdestinationField(line);
            break;
        default:
            document.getElementById("Messages").innerHTML = 'Opcode ' + opcode + ' not supported';
    }
}

/**
 * HTMLaddressField
 * Generate the HTML for the address field in the program form 
 * @param {String} line The line that the instruction is on... ex: C1, C15, etc...
 */
function HTMLaddressField(line) 
{
    result = `<select name="address" id="${line}address" onchange="updateAddressValue(event, '${line}')">\n`;
    result += '<option value="0" selected="selected">0</option>\n';
    for (i = 1; i < maxMemory; i++)
        result += '<option value="' + i + '">' + i + '</option>\n';
    result += '</select>\n';
    
    return result;
}

/**
 * HTMLdestinationField
 * Generate the HTML for the destination field in the program form
 * @param {String} line The line that the instruction is on... ex: C1, C15, etc...
 */
function HTMLdestinationField(line) 
{
    result = `<select name="destination" id="${line}destination" onchange="updateAddressValue(event, '${line}')">\n`;
    result += '<option value="C1" selected="selected">C1</option>\n';
    for (i = 2; i <= currInstr; i++) result += '<option value="C' + i + '">C' + i + '</option>\n';
    result += '</select>\n';
    return result;
}

/**
 * HTMLlabelField
 * Generate the HTML for the label field in the program form
 * @param {String} line The line that the instruction is on... ex: C1, C15, etc...
 */
function HTMLlabelField(line) 
{
    result = '<td class="label" width="100px">';
    result += '<input type="text" size="4" value=';
    result += line;
    result += ' id="';
    result += line;
    result += 'label" readonly="readonly"';
    result += ' /></td>\n';
    return result;
}

/**
 * HTMLmemoryTable
 * Generate the HTML for the memory table
 */
function HTMLmemoryTable() 
{
    result = '<fieldset>\n';
    result += '<legend>Memory</legend>\n';
    result += '<table style="border-collapse: collapse;">\n';
    result += '<tr style="text-align:center">\n';
    result += '<td style="width:6em">Address</td>';
    result += '<td style="width:6em">Contents</td>\n';
    result += '</tr>\n';

    for (i = 0; i < maxMemory; i++) 
    {
        result += '<tr style="text-align:center">\n';
        result += '<td>' + i + '</td>';
        result += '<td>'
            + (memoryTable[i] === null ? '-' : memoryTable[i]) + '</td>\n';
        result += '</tr>\n';
    }

    result += '</table>\n';
    result += '</fieldset>\n';
    document.getElementById("memoryTable").innerHTML = result;
}

/**
 * HTMLopCodeField
 * Generate the HTML for the opcode field in the program form
 * @param {String} line The line that the instruction is on... ex: C1, C15, etc...
 */
function HTMLopCodeField(line) 
{
    result = '<td><select name="opcode" id=';
    result += '"' + line + 'opcode"';
    result += ' onChange="generateOpCodeFields(';
    result += "'" + line + "'";
    result += ')">\n';
    result += '<option value="NONE" selected="selected">&nbsp;</option>\n';
    result += '<option value="SAVE">SAVE</option>\n';
    result += '<option value="STORE">STORE</option>\n';
    result += '<option value="INC">INC</option>\n';
    result += '<option value="DEC">DEC</option>\n';
    result += '<option value="GETA">GETA</option>\n';
    result += '<option value="GETB">GETB</option>\n';
    result += '<option value="ADD">ADD</option>\n';
    result += '<option value="SUB">SUB</option>\n';
    result += '<option value="MULT">MULT</option>\n';
    result += '<option value="DIV">DIV</option>\n';
    result += '<option value="REM">REM</option>\n';
    result += '<option value="GETINPUT">GETINPUT</option>\n';
    result += '<option value="OUTPUT">OUTPUT</option>\n';
    result += '<option value="JUMP">JUMP</option>\n';
    result += '<option value="JUMPIFZERO">JUMPIFZERO</option>\n';
    result += '<option value="JUMPIFNOTZERO">JUMPIFNOTZERO</option>\n';
    result += '<option value="GOSUB">GOSUB</option>\n';
    result += '<option value="RETURN">RETURN</option>\n';
    result += '</select></td>\n';
    return result;
}

/**
 * HTMLoperandField
 * Generate the HTML for the operand field in the program form
 * @param {String} line The line that the instruction is on... ex: C1, C15, etc...
 */
function HTMLoperandField(line) 
{
    return `<input type="text" size="10" onchange="updateOperandValue(event, '${line}')" id="${line}operand" />`;
}

/**
 * HTMLprogramForm
 * Generate the HTML for the program form
 */
function HTMLprogramForm() 
{
    result = '<fieldset>\n';
    result += '<legend>Program</legend>\n';
    result += '<table id="opcodeList">\n';
    result += '<tr id="descriptionTitles">\n';
    result += '<td width="5%">PC</td>\n';
    result += '<td width="15%">Instruction</td>\n';
    result += '<td width="18%">Opcode</td>\n';
    result += '<td width="15%">Operand</td>\n';
    result += '<td width="15%">Address</td>\n';
    result += '<td>Comment</td>\n';
    result += '</tr>\n';
    for (i = 1; i <= currInstr; i++) 
    {
        label = 'C' + i;
        result += '<tr>\n';
        result += '<td width="5%" style="color:red" id="' + label + 'PC">';
        if (i == PC) {
            result += '==&gt;</td>\n';
        } else {
            result += '&nbsp;</td>\n';
        }
        result += HTMLlabelField(label);
        result += HTMLopCodeField(label);
        result += '<td id="' + label + 'operandTD" width="15%">&nbsp;</td>\n';
        result += '<td id="' + label + 'addressTD" width="15%">&nbsp;</td>\n';
        result += `<td class="comment">`
        result += `<input id="${label}comment" onchange="updateCommentValue(event, '${label}')" type="text" size="40" /></td>\n`;
        result += '</tr>\n';
    }// for
    result += '</table>\n';
    result += '</fieldset> \n';
    document.getElementById("program").innerHTML = result;
}

/**
 * clearTab
 * Clears all the fields in the tab...
 */
function clearTab() {
    // Ask the user if they are totally sure...
    if (!confirm('Are you sure you want to clear EVERYTHING?!')) return;

    // Render our entire fields empty...
    HTMLprogramForm();

    // Clear our opcodes...
    tabTable[activeTab].instructionTable = [];

    // Save the session...
    saveSession();

    // Load our session...
    loadSession();
}

/**
 * intDiv
 * Perform integer division.
 * @param {Integer} a The first integer...
 * @param {Integer} b The second integer...
 */
function intDiv(a, b) 
{
    var result = a / b;
    if (result >= 0) return Math.floor(result);
    else return Math.ceil(result);
}

/**
 * loadAll
 * Load the entire page.
 */
function loadAll() {
    regA = regB = regResult = null;
    HTMLprogramForm();
    HTMLmemoryTable();
    HTMLinstructionForm();
    showRegA();
    showRegB();
    showRegResult();
    document.getElementById('Messages').innerHTML = '&nbsp;';
    document.getElementById('input').value = null;
    document.getElementById('output').value = null;

    // Load our session...
    loadSession();
}

/**
 * HTMLinstructionForm
 * Generate the HTML for the Instructions form
 */
function HTMLinstructionForm() {
    result = "<fieldset>\n";
    result += "  <legend>Instructions</legend>\n";
    result += '  <input type="button" value="Clear" onclick="clearTab()" />\n';
    result += "</fieldset>\n";
    document.getElementById("instructions").innerHTML = result;
}

/**
 * resetPC
 * Reset the Program Counter to the first instruction.
 */
function resetPC() {
    currPC = 'C' + PC + 'PC';
    document.getElementById(currPC).innerHTML = '&nbsp';
    document.getElementById('C1PC').innerHTML = '==>';
    resetMemory();
    document.querySelector('#registerA').value = '';
    document.querySelector('#registerB').value = '';
    document.querySelector('#registerResult').value = '';
    document.getElementById('iomessages').innerHTML = ``;
    waitingForInput = false;
    returnStack = [];
    PC = 1;
}

/**
 * showRegA
 * Update the value of the A register field
 */
function showRegA() 
{
    document.getElementById("registerA").value = regA;
}

/**
 * showRegB
 * Update the value of the B register field
 */
function showRegB() 
{
    document.getElementById("registerB").value = regB;
}

/**
 * showRegResult
 * Update the value of the Result register field
 */
function showRegResult() 
{
    document.getElementById("registerResult").value = regResult;
}

/**
 * setObj
 * Add extra functionality to the setObj function 
 * by converting our input into JSON format...
 */
Storage.prototype.setObj = function(key, obj) 
{
    return this.setItem(key, JSON.stringify(obj))
}

/**
 * getObj
 * Add extra functionality to the setObj function 
 * by converting our stored values from JSON into objects...
 */
Storage.prototype.getObj = function(key) 
{
    return JSON.parse(this.getItem(key))
}

/**
 * setupObject
 * Sets up the object given an id...
 * @param {String} line The line of the object...
 */
function setupObject(line, opcode, render = true) 
{
    // Attempt to find our instruction if it is already added...
    var indexOf = operationTable.findIndex((x) => x.pos === line);

    // Check if we found our opcode...
    if (indexOf !== -1)
    {
        // Check if our opcode is NONE
        if (opcode === 'NONE') 
            // If so, delete it...
            operationTable.splice(indexOf, 1);
        else
            // Replace our old opcode with the new one...
            operationTable[indexOf].opcode = opcode;
    }
    else
        // Add our opcode to the list...
        // Setup our item added with the position as the first item and the opcode following it.
        operationTable.push(generateObject(line, opcode));  

    // Save our session...
    saveSession();

    // Check if we want to render the saving notification...
    if (render) displayLoader();
}

/**
 * initializeTabs
 * Initializes the tab system...
 */
function initializeTabs() 
{
    // Add a init item to the tab table...
    tabTable.push(generateTabObject("untitled.c15", []));

    // Reset our active tab...
    activeTab = 0;

    // Save our session...
    saveSession();
}

/**
 * loadSession
 * Loads the session...
 */
function loadSession() 
{
    // Get our tabs from storage...
    let tabs = window.localStorage.getObj("tabs");

    // Setup our tabs if they aren't null...
    if (tabs !== null) tabTable = tabs;
    // Otherwise, initialize everything...
    else initializeTabs();

    // Reset our pc...
    resetPC();

    // Clear our instructions...
    HTMLprogramForm();

    // Iterate throughout our array...
    Array.from(tabTable[activeTab].instructionTable).forEach((value, index, array) => 
    {
        // Load opcodes... //

        // Get the opcode element.
        let opcodeObject = document.getElementById(`${value.pos}opcode`);

        // Check if our opcode object even exists... If not, skip it.
        if (opcodeObject === null) return;

        // Setup our opcode value...
        opcodeObject.value = value.opcode;

        // Generate our fields...
        generateOpCodeFields(value.pos, false);

        // Load operands... //

        // Setup our operand object...
        let operandObject = document.getElementById(`${value.pos}operand`);

        // Setup our value if it exists...
        if (operandObject !== null) operandObject.value = value.operand;

        // Load addresses and destinations... //

        // Setup our address and destination object...
        let addressObject = document.getElementById(`${value.pos}address`);
        let destinationObject = document.getElementById(`${value.pos}destination`);

        // Setup the value of the address object...
        if (addressObject !== null && value.address.length > 0) addressObject.value = value.address;
        else if (destinationObject !== null && value.address.length > 0) destinationObject.value = value.address;

        // Load comments... //

        // Setup our elements value...
        document.getElementById(`${value.pos}comment`).value = value.comment;
    })

    // Set our operation table to match our saved table...
    operationTable = tabTable[activeTab].instructionTable;   

    // Render our tabs...
    renderTabs();
}

/**
 * exportScript
 * Exports the current tab to a file...
 */
function exportScript() 
{
    // Setup our object to export...
    let exportObject = JSON.stringify(tabTable[activeTab]);

    // Setup a A element...
    var element = document.createElement('a');
    
    // Set the data attribute to be the exported objects value...
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(exportObject));

    // Set the name of the file as the tabs name...
    element.setAttribute('download', tabTable[activeTab].name);

    // Don't display the element...
    element.style.display = 'none';

    // Append the element to the document's body...
    document.body.appendChild(element);

    // Simulate a click...
    element.click();

    // Remove the element from existance...
    document.body.removeChild(element);
}

/**
 * importScript
 * Imports a file and adds it...
 * @param {File} file The file handle.
 */
function importScript(file) 
{
    // Double check if it isn't null...
    if (file === null) return;

    // Open up our file in a FileReader...
    let reader = new FileReader();

    // Setup our onload function in our reader...
    reader.onload = function()
    {
        // Setup the object from our file...
        let object = JSON.parse(reader.result);

        // Reset the name of the file...
        object.name = file.name;

        // Push our tab to the table...
        let index = tabTable.push(object);

        // Save our session...
        saveSession();

        // Select the previous tab...
        selectTab(index - 1);
    };

    // Read our file as text...
    reader.readAsText(file);
}

/**
 * renderTabs
 * Renders all the tabs...
 */
function renderTabs() {
    // Get our menu element...
    let menu = document.getElementById(`menu`);

    // Empty our innerHTML...
    menu.innerHTML = ``;

    // Iterate throughout our tabs...
    Array.from(tabTable).forEach((value, index, array) => 
    {
        // Check if a specific tab is active...
        if (index === activeTab)
            // Insert our html for our active tab...
            menu.insertAdjacentHTML("beforeend", `<div class="active">
                <img src="img/icon.svg" class="icon" />
                ${value.name}
                <img src="img/x.svg" onclick="deleteTab(${index})" class="x" />
            </div>`)
        else
            // Insert our html for our non active tab...
            menu.insertAdjacentHTML("beforeend", 
            `<div onclick="selectTab(${index})"><img src="img/icon.svg" class="icon" />${value.name}</div>`)
    })

    // Insert our add item...
    menu.insertAdjacentHTML("beforeend", `<div onclick="addTab()"><img src="img/add.svg" class="add" /></div>`)
}

/**
 * selectTab
 * Selects the desired tab...
 * @param {Integer} index The index of the tab...
 */
function selectTab(index)
{
    // Set the active tab to the correct index...
    activeTab = index;

    // Load up a session once more...
    loadSession();
}

/**
 * addTab
 * Adds a tab to the tab table...
 */
function addTab() 
{
    // Prompt the user with a question of what to name the new file...
    let name = prompt("Please enter a new name. (leave blank if you don't care)");

    // Double check if it isn't null...
    if (name === null) return;

    // Check if the user didn't type anything in...
    if (name.length === 0) name = "untitled";

    // Push our tab to the table...
    let index = tabTable.push(generateTabObject(`${name}.c15`, []));

    // Save our session...
    saveSession();

    // Select the new tab...
    selectTab(index - 1);
}

/**
 * renameTab
 * Renames the tab that the user is currently viewing...
 */
function renameTab() 
{
    // Setup the previous tab name...
    let previousName = tabTable[activeTab].name.replace(".c15", "");

    // Prompt the user with a question of what to name the new file...
    let name = prompt("What would you like to rename it to?", previousName);

    // Double check if it isn't null...
    if (name === null) return;

    // Check if the user didn't type anything in...
    if (name.length === 0) name = "untitled";

    // Actually rename the tab...
    tabTable[activeTab].name = `${name}.c15`;

    // Save our session...
    saveSession();

    // Rerender our session...
    loadSession();
}

/**
 * deleteTab
 * Deletes a tab...
 * @param {Integer} index The index of the tab...
 */
function deleteTab(index) 
{
    // Ask the user if they are totally sure...
    if (!confirm('Are you sure you want to delete this?')) return;

    // Attempt to get our item from the tab table...
    let object = tabTable[index];

    // Check if the item even exists then delete it...
    if (object === null) return;

    // Remove it from the table...
    tabTable.splice(index, 1);

    // Now check if there aren't any items in the tab list...
    if (tabTable.length === 0) initializeTabs();
    // Otherwise, save and render...
    else if (activeTab !== 0) activeTab -= 1;

    // Save our session...
    saveSession();

    // Rerender our session...
    loadSession();
}

/**
 * saveSession
 * Saves sessions...
 */
function saveSession() 
{  
    // Set our new object to the local storage...
    window.localStorage.setObj("tabs", tabTable);
}

/**
 * resetMemory
 * Resets the memory of the emulator.
 */
function resetMemory() 
{
    // Iterate throughout our memory to reset everything to null.
    for (i = 0; i < maxMemory; i++) memoryTable[i] = null;

    // Rerender our memory table...
    HTMLmemoryTable();
}

/**
 * validateKeyPress
 * Validates the key presses on the form.
 */
function validateKeyPress(event) 
{
    // Check if the return key was pressed...
    if (event.keyCode === 13) 
    {
        // Prevent default behaviour.
        event.preventDefault();

        // Execute the current instruction...
        executeCurrent();
    }
}

/**
 * generateObject
 * Sets up a operation object for later use...
 * Contains tons of characteristics of each operation...
 * @param {String} pos The position of the opcode...
 * @param {String} opcode The opcode itself...
 * @param {String} operand The operand if used..
 * @param {String} address The address...
 * @param {String} comment A comment used to describe the operation.
 */
function generateObject(pos, opcode, operand = '', address = '', comment = '') 
{ 
    return { pos: pos, opcode: opcode, operand: operand, address: address, comment: comment } 
}

/**
 * generateTabObject
 * Generates a tab object...
 * @param {String} name The name (title) of the tab...
 * @param {Object} instructionTable The instruction table...
 */
function generateTabObject(name, instructionTable)
{
    return { name: name, instructionTable: instructionTable };
}

/**
 * updateOperandValue
 * Updates the value of the operand connected to the instruction...
 * @param {Event} event The context event...
 * @param {String} instruction The identifier of the instruction...
 */
function updateOperandValue(event, instruction) 
{
    // Setup our new value...
    var value = event.target.value;

    // Double-check if our input is valid...
    if (!validateInput(value)) return;

    // Attempt to find our instruction in the table...
    var indexOf = operationTable.findIndex((x) => x.pos === instruction);

    // Check if we found our opcode...
    if (indexOf === -1) return;

    // Setup our object...
    var operation = operationTable[indexOf];

    // Set the new value of the operand...
    operation.operand = parseInt(value, 10);

    // Save our session...
    saveSession();

    // Display loader of this happening...
    displayLoader();
}

/**
 * updateAddressValue
 * Updates the value of the operand connected to the instruction...
 * @param {Event} event The context event...
 * @param {String} instruction The identifier of the instruction...
 */
function updateAddressValue(event, instruction) 
{
    // Attempt to find our instruction in the table...
    var indexOf = operationTable.findIndex((x) => x.pos === instruction);

    // Check if we found our opcode...
    if (indexOf === -1) return;

    // Setup our object...
    var operation = operationTable[indexOf];

    // Setup our new value...
    operation.address = event.target.value;

    // Save our session...
    saveSession();

    // Display loader of this happening...
    displayLoader();
}

/**
 * updateAddressValue
 * Updates the value of the operand connected to the instruction...
 * @param {Event} event The context event...
 * @param {String} instruction The identifier of the instruction...
 */
function updateCommentValue(event, instruction) 
{
    // Attempt to find our instruction in the table...
    var indexOf = operationTable.findIndex((x) => x.pos === instruction);

    // Check if we found our opcode...
    if (indexOf === -1) return;

    // Setup our object...
    var operation = operationTable[indexOf];

    // Update our operation's value...
    operation.comment = event.target.value;

    // Save our session...
    saveSession();

    // Display loader of this happening...
    displayLoader();
}

/**
 * displayLoader
 * Displays the loader animation...
 */
function displayLoader() 
{
    // Set the display of the loader to none...
    document.getElementById(`loader`).style.animation = "fadein 0.7s";

    // Listen for when the animation is finished...
    document.getElementById(`loader`).addEventListener('webkitAnimationEnd', function()
    {
        this.style.animation = "";
    }, false);
}


/**
 * validateInput
 * Verifies if the input given is a valid one...
 * @param {String} input The input you want checked...
 */
function validateInput(input) 
{
    return input.length > 0 && !isNaN(input);
}

/**
 * Setup our drop and drag features...
 */

// Overwrite the drag enter funtionality...
window.ondragenter = function (event) { event.preventDefault(); return false; };

// Overwrite the drag leave funtionality...
window.ondragleave = function () { return false; };

// Overwrite the drag over funtionality...
window.ondragover = function (event) { event.preventDefault() }

// Overwrite the on drop functionality...
window.ondrop = function (event) 
{
    // Prevent default behaviour...
    event.preventDefault();
    
    // Double check if our file dropped is valid...
    if (event.dataTransfer.files[0] === undefined) return;
    
    // Import our actual script...
    importScript(event.dataTransfer.files[0]);
    
    // Return false...
    return false;
};